/**
 * DiceRenderer - Renders and animates the 3D dice
 */
import { ANIMATION_DURATIONS, PLAYER_COLORS, PLAYER_ORDER } from '../core/Constants.js';
import { eventBus, GameEvents } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class DiceRenderer {
    constructor() {
        this.diceContainer = document.getElementById('dice-container');
        this.diceElement = document.getElementById('dice');
        this.rollButton = document.getElementById('roll-btn');
        this.resultDisplay = document.getElementById('dice-result');

        this.isRolling = false;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Button click
        this.rollButton.addEventListener('click', () => this.onRollClick());

        // Game events
        eventBus.on(GameEvents.DICE_ROLL_START, () => this.startRollAnimation());
        eventBus.on(GameEvents.DICE_ROLL_COMPLETE, (data) => this.showResult(data.value));
        eventBus.on(GameEvents.TURN_START, (data) => this.onTurnStart(data.player));
        eventBus.on(GameEvents.TURN_END, () => this.reset());
        eventBus.on(GameEvents.GAME_START, () => this.enable());
    }

    /**
     * Handle roll button click
     */
    onRollClick() {
        if (this.isRolling) return;

        const player = gameState.getCurrentPlayer();
        if (player && !player.isAI) {
            eventBus.emit(GameEvents.DICE_ROLL_START, {});
        }
    }

    /**
     * Handle turn start
     * @param {Object} player
     */
    onTurnStart(player) {
        this.reset();
        this.updateColorIndicator(player.color);

        if (player.isAI) {
            this.disable();
        } else {
            this.enable();
        }
    }

    /**
     * Update dice container color to match current player
     * @param {string} color
     */
    updateColorIndicator(color) {
        // Remove all color classes
        PLAYER_ORDER.forEach(c => {
            this.diceContainer.classList.remove(`${c.toLowerCase()}-turn`);
        });

        // Add current player color
        this.diceContainer.classList.add(`${color.toLowerCase()}-turn`);
    }

    /**
     * Start the roll animation
     */
    startRollAnimation() {
        this.isRolling = true;
        this.disable();
        this.resultDisplay.textContent = '';
        this.resultDisplay.className = 'dice-result';

        // Remove previous value class
        this.diceElement.removeAttribute('data-value');

        // Add rolling animation
        this.diceElement.classList.add('rolling');
    }

    /**
     * Show the dice result
     * @param {number} value
     */
    showResult(value) {
        // Stop rolling animation
        this.diceElement.classList.remove('rolling');

        // Set final rotation for the value
        this.diceElement.setAttribute('data-value', value);

        // Show result text
        setTimeout(() => {
            this.resultDisplay.textContent = value;
            this.resultDisplay.classList.add('highlight');

            if (value === 6) {
                this.resultDisplay.classList.add('six');
            }

            setTimeout(() => {
                this.resultDisplay.classList.remove('highlight');
            }, 500);
        }, 200);

        this.isRolling = false;

        // Re-enable button if player can roll again
        if (gameState.canRollAgain() && !gameState.getCurrentPlayer().isAI) {
            setTimeout(() => this.enable(), ANIMATION_DURATIONS.TOKEN_MOVE);
        }
    }

    /**
     * Reset dice state
     */
    reset() {
        this.isRolling = false;
        this.resultDisplay.textContent = '';
        this.resultDisplay.className = 'dice-result';
        this.diceElement.classList.remove('rolling');
        this.diceElement.removeAttribute('data-value');
    }

    /**
     * Enable roll button
     */
    enable() {
        this.rollButton.disabled = false;
    }

    /**
     * Disable roll button
     */
    disable() {
        this.rollButton.disabled = true;
    }

    /**
     * Get current rolling state
     * @returns {boolean}
     */
    isCurrentlyRolling() {
        return this.isRolling;
    }

    /**
     * Force show a specific value (for debugging)
     * @param {number} value
     */
    forceShow(value) {
        this.diceElement.setAttribute('data-value', value);
        this.resultDisplay.textContent = value;
    }
}
