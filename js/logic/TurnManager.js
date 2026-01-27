/**
 * TurnManager - Handles turn flow and game progression
 */
import { TURN_PHASE, ANIMATION_DURATIONS, MAX_CONSECUTIVE_SIXES } from '../core/Constants.js';
import { eventBus, GameEvents } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { dice } from './Dice.js';
import { Rules } from './Rules.js';

export class TurnManager {
    constructor() {
        this.isProcessing = false;
        this.turnQueue = [];
        this.aiController = null;

        this.setupEventListeners();
    }

    /**
     * Set AI controller reference
     * @param {Object} aiController
     */
    setAIController(aiController) {
        this.aiController = aiController;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        eventBus.on(GameEvents.GAME_START, () => this.onGameStart());
        eventBus.on(GameEvents.TOKEN_MOVE_COMPLETE, (data) => this.onMoveComplete(data));
    }

    /**
     * Handle game start
     */
    onGameStart() {
        this.startTurn();
    }

    /**
     * Start a new turn
     */
    async startTurn() {
        const player = gameState.getCurrentPlayer();

        gameState.setTurnPhase(TURN_PHASE.WAITING);
        eventBus.emit(GameEvents.TURN_START, { player });

        // Small delay before turn starts
        await this.delay(ANIMATION_DURATIONS.TURN_DELAY);

        // If AI player, automatically handle turn
        if (player.isAI && this.aiController) {
            await this.handleAITurn();
        }
        // Otherwise wait for player input (roll button click)
    }

    /**
     * Handle dice roll request
     * @returns {Promise<number>} Dice value
     */
    async rollDice() {
        if (gameState.turnPhase !== TURN_PHASE.WAITING) {
            return null;
        }

        gameState.setTurnPhase(TURN_PHASE.ROLLING);

        // Roll the dice
        const value = await dice.roll();
        gameState.setDiceValue(value);

        // Track sixes
        if (value === 6) {
            gameState.getCurrentPlayer().recordSix();
        }

        // Check for three consecutive sixes
        if (gameState.isTurnForfeited()) {
            eventBus.emit(GameEvents.SHOW_MESSAGE, {
                message: 'Three 6s! Turn forfeited!',
                type: 'warning'
            });
            await this.delay(ANIMATION_DURATIONS.MESSAGE_DISPLAY);
            this.endTurn();
            return value;
        }

        // Get valid moves
        const validMoves = Rules.getValidMoves(
            gameState.getCurrentPlayer(),
            value,
            gameState.players
        );

        gameState.setValidMoves(validMoves);

        // If no valid moves, end turn
        if (validMoves.length === 0) {
            eventBus.emit(GameEvents.SHOW_MESSAGE, {
                message: 'No valid moves!',
                type: 'info'
            });
            await this.delay(ANIMATION_DURATIONS.MESSAGE_DISPLAY);
            this.endTurn();
            return value;
        }

        // If only one valid move, auto-select it
        if (validMoves.length === 1) {
            await this.executeMove(validMoves[0]);
            return value;
        }

        // Multiple moves available - wait for player selection
        gameState.setTurnPhase(TURN_PHASE.SELECTING);

        // If AI, select move
        if (gameState.getCurrentPlayer().isAI && this.aiController) {
            const move = await this.aiController.selectMove(validMoves, gameState);
            await this.executeMove(move);
        }

        return value;
    }

    /**
     * Handle token selection
     * @param {string} tokenId - Selected token ID
     */
    async selectToken(tokenId) {
        if (gameState.turnPhase !== TURN_PHASE.SELECTING) {
            return;
        }

        const player = gameState.getCurrentPlayer();

        // Find the move for this token
        const move = gameState.validMoves.find(m => m.tokenId === tokenId);

        if (!move) {
            eventBus.emit(GameEvents.SHOW_MESSAGE, {
                message: 'Invalid selection',
                type: 'error'
            });
            return;
        }

        await this.executeMove(move);
    }

    /**
     * Execute a move
     * @param {Object} move - Move to execute
     */
    async executeMove(move) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        gameState.setTurnPhase(TURN_PHASE.MOVING);
        gameState.selectToken(move.tokenId);

        // Validate move
        const validation = Rules.validateMove(move, gameState);
        if (!validation.valid) {
            console.error('Invalid move:', validation.reason);
            this.isProcessing = false;
            return;
        }

        // Emit move start event
        eventBus.emit(GameEvents.TOKEN_MOVE_START, {
            move,
            player: gameState.getCurrentPlayer()
        });

        // Execute the move in game state
        const result = Rules.executeMove(move, gameState);

        // Emit appropriate events
        if (move.type === 'unlock') {
            eventBus.emit(GameEvents.TOKEN_UNLOCK, { token: move.token });
        }

        eventBus.emit(GameEvents.TOKEN_MOVE, {
            move,
            result
        });

        // Handle capture
        if (result.captured) {
            eventBus.emit(GameEvents.TOKEN_CAPTURE, {
                capturer: move.token,
                captured: result.captured
            });

            // Play capture effects
            eventBus.emit(GameEvents.EFFECT_CAPTURE, {
                position: move.toPosition,
                capturedColor: result.captured.color
            });
            eventBus.emit(GameEvents.EFFECT_SHAKE, { intensity: 10 });
        }

        // Handle finish
        if (result.finished) {
            eventBus.emit(GameEvents.TOKEN_FINISH, {
                token: move.token,
                player: gameState.getCurrentPlayer()
            });
        }

        // Wait for animation
        await this.delay(ANIMATION_DURATIONS.TOKEN_MOVE * (move.path?.length || 1));

        // Check for win
        if (Rules.hasWon(gameState.getCurrentPlayer())) {
            await this.handleWin();
            this.isProcessing = false;
            return;
        }

        // Emit move complete
        eventBus.emit(GameEvents.TOKEN_MOVE_COMPLETE, { move, result });

        this.isProcessing = false;
    }

    /**
     * Handle move completion
     * @param {Object} data - Move completion data
     */
    async onMoveComplete(data) {
        const { result } = data;

        // Check for extra turn
        if (result.extraTurn || gameState.canRollAgain()) {
            eventBus.emit(GameEvents.SHOW_MESSAGE, {
                message: result.captured ? 'Capture! Roll again!' : 'Rolled 6! Roll again!',
                type: 'success'
            });

            gameState.setTurnPhase(TURN_PHASE.WAITING);
            gameState.selectToken(null);
            gameState.setValidMoves([]);

            // If AI, continue turn
            if (gameState.getCurrentPlayer().isAI && this.aiController) {
                await this.delay(ANIMATION_DURATIONS.AI_THINK);
                await this.rollDice();
            }
        } else {
            this.endTurn();
        }
    }

    /**
     * End the current turn
     */
    async endTurn() {
        const previousPlayer = gameState.getCurrentPlayer();

        eventBus.emit(GameEvents.TURN_END, { player: previousPlayer });

        // Move to next player
        gameState.nextTurn();

        // Clear selections
        gameState.selectToken(null);
        gameState.setValidMoves([]);
        dice.reset();

        // Start next turn
        await this.delay(ANIMATION_DURATIONS.TURN_DELAY);
        await this.startTurn();
    }

    /**
     * Handle AI turn
     */
    async handleAITurn() {
        if (!this.aiController) return;

        await this.delay(ANIMATION_DURATIONS.AI_THINK);
        await this.rollDice();
    }

    /**
     * Handle win condition
     */
    async handleWin() {
        const winner = gameState.getCurrentPlayer();
        gameState.setWinner(winner);

        eventBus.emit(GameEvents.PLAYER_WIN, { player: winner });
        eventBus.emit(GameEvents.EFFECT_VICTORY, { winner });
    }

    /**
     * Skip current turn (for debugging or forfeit)
     */
    skipTurn() {
        eventBus.emit(GameEvents.TURN_SKIP, {
            player: gameState.getCurrentPlayer()
        });
        this.endTurn();
    }

    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reset turn manager
     */
    reset() {
        this.isProcessing = false;
        this.turnQueue = [];
    }
}

// Create singleton instance
export const turnManager = new TurnManager();
