/**
 * GameState - Central state management for the game
 */
import { GAME_PHASE, TURN_PHASE, PLAYER_ORDER, TOKENS_PER_PLAYER } from './Constants.js';
import { eventBus, GameEvents } from './EventBus.js';
import { Player } from '../logic/Player.js';

export class GameState {
    constructor() {
        this.reset();
    }

    /**
     * Reset the game state to initial values
     */
    reset() {
        this.phase = GAME_PHASE.MENU;
        this.turnPhase = TURN_PHASE.WAITING;
        this.gameMode = null;  // 'local' or 'ai'
        this.aiDifficulty = 'MEDIUM';

        this.players = [];
        this.currentPlayerIndex = 0;

        this.diceValue = null;
        this.consecutiveSixes = 0;
        this.rollsThisTurn = 0;

        this.selectedToken = null;
        this.validMoves = [];

        this.winner = null;
        this.moveHistory = [];

        this.soundEnabled = true;
        this.isPaused = false;
    }

    /**
     * Initialize game with player configuration
     * @param {Object} config - Game configuration
     * @param {string} config.mode - 'local' or 'ai'
     * @param {Array} config.players - Player data array
     * @param {string} config.aiDifficulty - AI difficulty level
     */
    initGame(config) {
        this.reset();
        this.gameMode = config.mode;
        this.aiDifficulty = config.aiDifficulty || 'MEDIUM';

        // Initialize players using Player class
        this.players = config.players.map((playerData, index) => {
            return new Player(index, {
                name: playerData.name || `Player ${index + 1}`,
                isAI: playerData.isAI || false,
                aiDifficulty: config.aiDifficulty || 'MEDIUM'
            });
        });

        this.phase = GAME_PHASE.PLAYING;
        this.turnPhase = TURN_PHASE.WAITING;
        this.currentPlayerIndex = 0;

        eventBus.emit(GameEvents.GAME_START, {
            players: this.players,
            mode: this.gameMode
        });
    }

    /**
     * Get current player
     * @returns {Player} Current player object
     */
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    /**
     * Get player by index
     * @param {number} index - Player index
     * @returns {Player} Player object
     */
    getPlayer(index) {
        return this.players[index];
    }

    /**
     * Get all tokens for a player
     * @param {number} playerIndex - Player index
     * @returns {Array} Array of tokens
     */
    getPlayerTokens(playerIndex) {
        return this.players[playerIndex]?.tokens || [];
    }

    /**
     * Get a specific token
     * @param {string} tokenId - Token ID
     * @returns {Object|null} Token object or null
     */
    getToken(tokenId) {
        for (const player of this.players) {
            const token = player.getTokenById(tokenId);
            if (token) return token;
        }
        return null;
    }

    /**
     * Get all tokens on the board (active state)
     * @returns {Array} Array of active tokens
     */
    getActiveTokens() {
        const active = [];
        for (const player of this.players) {
            active.push(...player.getActiveTokens());
        }
        return active;
    }

    /**
     * Get tokens at a specific position
     * @param {number} row - Row position
     * @param {number} col - Column position
     * @returns {Array} Array of tokens at position
     */
    getTokensAtPosition(row, col) {
        return this.getActiveTokens().filter(
            t => t.position && t.position.row === row && t.position.col === col
        );
    }

    /**
     * Set dice value
     * @param {number} value - Dice value (1-6)
     */
    setDiceValue(value) {
        this.diceValue = value;
        this.rollsThisTurn++;

        if (value === 6) {
            this.consecutiveSixes++;
        } else {
            this.consecutiveSixes = 0;
        }

        eventBus.emit(GameEvents.DICE_ROLLED, {
            value,
            player: this.getCurrentPlayer(),
            consecutiveSixes: this.consecutiveSixes
        });
    }

    /**
     * Check if player can roll again (rolled a 6)
     * @returns {boolean} True if extra roll allowed
     */
    canRollAgain() {
        return this.diceValue === 6 && this.consecutiveSixes < 3;
    }

    /**
     * Check if turn is forfeited (3 consecutive sixes)
     * @returns {boolean} True if turn forfeited
     */
    isTurnForfeited() {
        return this.consecutiveSixes >= 3;
    }

    /**
     * Set selected token
     * @param {string|null} tokenId - Token ID or null to deselect
     */
    selectToken(tokenId) {
        const previousToken = this.selectedToken;
        this.selectedToken = tokenId;

        if (previousToken) {
            eventBus.emit(GameEvents.TOKEN_DESELECT, { tokenId: previousToken });
        }
        if (tokenId) {
            eventBus.emit(GameEvents.TOKEN_SELECT, { tokenId });
        }
    }

    /**
     * Set valid moves for current turn
     * @param {Array} moves - Array of valid move objects
     */
    setValidMoves(moves) {
        this.validMoves = moves;
        eventBus.emit(GameEvents.VALID_MOVES_UPDATE, { moves });
    }

    /**
     * Update token state and position
     * @param {string} tokenId - Token ID
     * @param {Object} updates - Properties to update
     */
    updateToken(tokenId, updates) {
        const token = this.getToken(tokenId);
        if (!token) return;

        Object.assign(token, updates);

        // Check if token finished
        if (updates.state === 'finished') {
            const player = this.players[token.playerIndex];
            player.finishedTokens++;

            eventBus.emit(GameEvents.TOKEN_FINISH, {
                token,
                player,
                totalFinished: player.finishedTokens
            });

            // Check for win
            if (player.finishedTokens >= TOKENS_PER_PLAYER) {
                this.setWinner(player);
            }
        }
    }

    /**
     * Record a move in history
     * @param {Object} move - Move data
     */
    recordMove(move) {
        this.moveHistory.push({
            ...move,
            timestamp: Date.now(),
            turnNumber: this.moveHistory.length + 1
        });
    }

    /**
     * Advance to next player's turn
     */
    nextTurn() {
        const previousPlayer = this.getCurrentPlayer();

        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

        // Reset turn state
        this.diceValue = null;
        this.consecutiveSixes = 0;
        this.rollsThisTurn = 0;
        this.selectedToken = null;
        this.validMoves = [];
        this.turnPhase = TURN_PHASE.WAITING;

        eventBus.emit(GameEvents.TURN_END, { player: previousPlayer });
        eventBus.emit(GameEvents.TURN_START, { player: this.getCurrentPlayer() });
    }

    /**
     * Set the game winner
     * @param {Object} player - Winning player
     */
    setWinner(player) {
        this.winner = player;
        this.phase = GAME_PHASE.GAME_OVER;
        eventBus.emit(GameEvents.PLAYER_WIN, { player });
        eventBus.emit(GameEvents.GAME_END, { winner: player });
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.phase === GAME_PHASE.PLAYING) {
            this.isPaused = true;
            this.phase = GAME_PHASE.PAUSED;
            eventBus.emit(GameEvents.GAME_PAUSE, {});
        }
    }

    /**
     * Resume the game
     */
    resume() {
        if (this.phase === GAME_PHASE.PAUSED) {
            this.isPaused = false;
            this.phase = GAME_PHASE.PLAYING;
            eventBus.emit(GameEvents.GAME_RESUME, {});
        }
    }

    /**
     * Toggle sound
     * @returns {boolean} New sound state
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        eventBus.emit(GameEvents.TOGGLE_SOUND, { enabled: this.soundEnabled });
        return this.soundEnabled;
    }

    /**
     * Set turn phase
     * @param {string} phase - Turn phase from TURN_PHASE constants
     */
    setTurnPhase(phase) {
        this.turnPhase = phase;
    }

    /**
     * Get game state snapshot (for AI or save/load)
     * @returns {Object} State snapshot
     */
    getSnapshot() {
        return {
            phase: this.phase,
            turnPhase: this.turnPhase,
            gameMode: this.gameMode,
            aiDifficulty: this.aiDifficulty,
            currentPlayerIndex: this.currentPlayerIndex,
            diceValue: this.diceValue,
            consecutiveSixes: this.consecutiveSixes,
            players: this.players.map(p => p.toObject()),
            winner: this.winner
        };
    }

    /**
     * Restore from snapshot
     * @param {Object} snapshot - State snapshot
     */
    restoreSnapshot(snapshot) {
        Object.assign(this, snapshot);
    }
}

// Create singleton instance
export const gameState = new GameState();
