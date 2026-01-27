/**
 * Dice - Handles dice rolling logic
 */
import { DICE_MIN, DICE_MAX, ANIMATION_DURATIONS } from '../core/Constants.js';
import { eventBus, GameEvents } from '../core/EventBus.js';

export class Dice {
    constructor() {
        this.currentValue = null;
        this.isRolling = false;
        this.rollHistory = [];
    }

    /**
     * Roll the dice
     * @returns {Promise<number>} The dice value (1-6)
     */
    async roll() {
        if (this.isRolling) {
            return null;
        }

        this.isRolling = true;
        eventBus.emit(GameEvents.DICE_ROLL_START, {});

        // Simulate rolling animation time
        await this.animateRoll();

        // Generate random value
        const value = this.generateValue();
        this.currentValue = value;
        this.rollHistory.push(value);

        this.isRolling = false;

        eventBus.emit(GameEvents.DICE_ROLL_COMPLETE, { value });

        return value;
    }

    /**
     * Generate random dice value
     * @returns {number} Value between DICE_MIN and DICE_MAX
     */
    generateValue() {
        return Math.floor(Math.random() * (DICE_MAX - DICE_MIN + 1)) + DICE_MIN;
    }

    /**
     * Animate the dice roll (visual delay)
     * @returns {Promise}
     */
    animateRoll() {
        return new Promise(resolve => {
            setTimeout(resolve, ANIMATION_DURATIONS.DICE_ROLL);
        });
    }

    /**
     * Get current dice value
     * @returns {number|null}
     */
    getValue() {
        return this.currentValue;
    }

    /**
     * Check if dice is currently rolling
     * @returns {boolean}
     */
    isCurrentlyRolling() {
        return this.isRolling;
    }

    /**
     * Reset dice for new turn
     */
    reset() {
        this.currentValue = null;
    }

    /**
     * Get roll history
     * @returns {Array<number>}
     */
    getHistory() {
        return [...this.rollHistory];
    }

    /**
     * Get last N rolls
     * @param {number} n - Number of rolls to get
     * @returns {Array<number>}
     */
    getLastRolls(n) {
        return this.rollHistory.slice(-n);
    }

    /**
     * Get statistics
     * @returns {Object}
     */
    getStats() {
        const total = this.rollHistory.length;
        if (total === 0) {
            return {
                total: 0,
                average: 0,
                counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
                percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
            };
        }

        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        let sum = 0;

        for (const value of this.rollHistory) {
            counts[value]++;
            sum += value;
        }

        const percentages = {};
        for (let i = 1; i <= 6; i++) {
            percentages[i] = ((counts[i] / total) * 100).toFixed(1);
        }

        return {
            total,
            average: (sum / total).toFixed(2),
            counts,
            percentages
        };
    }

    /**
     * Clear roll history
     */
    clearHistory() {
        this.rollHistory = [];
    }

    /**
     * Force a specific value (for testing)
     * @param {number} value - Value to set
     */
    forceValue(value) {
        if (value >= DICE_MIN && value <= DICE_MAX) {
            this.currentValue = value;
            this.rollHistory.push(value);
        }
    }
}

// Create singleton instance
export const dice = new Dice();
