/**
 * GameUI - In-game UI interactions
 */
import { eventBus, GameEvents } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { turnManager } from '../logic/TurnManager.js';
import { dice } from '../logic/Dice.js';

export class GameUI {
    constructor() {
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Dice roll button
        const rollBtn = document.getElementById('roll-btn');
        if (rollBtn) {
            rollBtn.addEventListener('click', () => this.onRollClick());
        }

        // Token selection
        eventBus.on(GameEvents.TOKEN_SELECT, (data) => this.onTokenSelect(data.tokenId));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * Handle roll button click
     */
    async onRollClick() {
        const player = gameState.getCurrentPlayer();

        // Only allow human players to click roll
        if (player && !player.isAI && !dice.isCurrentlyRolling()) {
            await turnManager.rollDice();
        }
    }

    /**
     * Handle token selection
     * @param {string} tokenId
     */
    async onTokenSelect(tokenId) {
        const player = gameState.getCurrentPlayer();

        // Only allow human players to select tokens
        if (player && !player.isAI) {
            await turnManager.selectToken(tokenId);
        }
    }

    /**
     * Handle keyboard input
     * @param {KeyboardEvent} e
     */
    handleKeyboard(e) {
        // Space bar to roll dice
        if (e.code === 'Space') {
            e.preventDefault();
            this.onRollClick();
        }

        // Number keys 1-4 to select tokens
        if (e.code >= 'Digit1' && e.code <= 'Digit4') {
            const tokenIndex = parseInt(e.code.replace('Digit', '')) - 1;
            this.selectTokenByIndex(tokenIndex);
        }

        // Escape to pause/menu
        if (e.code === 'Escape') {
            // Could open pause menu
        }
    }

    /**
     * Select token by index for current player
     * @param {number} index
     */
    selectTokenByIndex(index) {
        const player = gameState.getCurrentPlayer();
        if (!player || player.isAI) return;

        const validMoves = gameState.validMoves;
        if (validMoves.length === 0) return;

        // Find valid move for this token index
        const move = validMoves.find(m => m.token.tokenIndex === index);
        if (move) {
            this.onTokenSelect(move.tokenId);
        }
    }
}
