/**
 * AIController - Main AI controller that delegates to specific AI strategies
 */
import { AI_DIFFICULTY, ANIMATION_DURATIONS } from '../core/Constants.js';
import { EasyAI } from './EasyAI.js';
import { MediumAI } from './MediumAI.js';
import { HardAI } from './HardAI.js';

export class AIController {
    constructor() {
        this.strategies = {
            EASY: new EasyAI(),
            MEDIUM: new MediumAI(),
            HARD: new HardAI()
        };

        this.currentDifficulty = 'MEDIUM';
    }

    /**
     * Set AI difficulty
     * @param {string} difficulty - 'EASY', 'MEDIUM', or 'HARD'
     */
    setDifficulty(difficulty) {
        if (this.strategies[difficulty]) {
            this.currentDifficulty = difficulty;
        }
    }

    /**
     * Get the current AI strategy
     * @returns {Object}
     */
    getStrategy() {
        return this.strategies[this.currentDifficulty];
    }

    /**
     * Select a move from valid moves
     * @param {Array} validMoves - Array of valid move objects
     * @param {Object} gameState - Current game state
     * @returns {Promise<Object>} Selected move
     */
    async selectMove(validMoves, gameState) {
        if (validMoves.length === 0) return null;
        if (validMoves.length === 1) return validMoves[0];

        // Get thinking time for current difficulty
        const thinkTime = AI_DIFFICULTY[this.currentDifficulty].thinkTime;

        // Simulate thinking
        await this.delay(thinkTime);

        // Get move from current strategy
        const strategy = this.getStrategy();
        return strategy.selectMove(validMoves, gameState);
    }

    /**
     * Utility delay function
     * @param {number} ms
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create singleton instance
export const aiController = new AIController();
