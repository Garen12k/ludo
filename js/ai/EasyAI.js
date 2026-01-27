/**
 * EasyAI - Simple AI that mostly makes random moves
 */
import { AI_DIFFICULTY } from '../core/Constants.js';
import { Heuristics } from './Heuristics.js';

export class EasyAI {
    constructor() {
        this.randomness = AI_DIFFICULTY.EASY.randomness;
    }

    /**
     * Select a move from valid moves
     * @param {Array} validMoves - Array of valid move objects
     * @param {Object} gameState - Current game state
     * @returns {Object} Selected move
     */
    selectMove(validMoves, gameState) {
        if (validMoves.length === 0) return null;
        if (validMoves.length === 1) return validMoves[0];

        // Random chance to make completely random move
        if (Math.random() < this.randomness) {
            return this.randomMove(validMoves);
        }

        // Otherwise, make a simple strategic choice
        return this.simpleStrategy(validMoves, gameState);
    }

    /**
     * Select a random move
     * @param {Array} validMoves
     * @returns {Object}
     */
    randomMove(validMoves) {
        const index = Math.floor(Math.random() * validMoves.length);
        return validMoves[index];
    }

    /**
     * Simple strategy - prioritize obvious good moves
     * @param {Array} validMoves
     * @param {Object} gameState
     * @returns {Object}
     */
    simpleStrategy(validMoves, gameState) {
        // Priority order (simplified):
        // 1. Capture
        // 2. Finish
        // 3. Unlock (if few tokens out)
        // 4. Random

        // Check for captures
        const captures = validMoves.filter(m => m.type === 'capture');
        if (captures.length > 0) {
            return this.randomMove(captures);
        }

        // Check for finish moves
        const finishes = validMoves.filter(m => m.type === 'finish');
        if (finishes.length > 0) {
            return this.randomMove(finishes);
        }

        // Check for unlocks (prioritize if few tokens active)
        const player = gameState.getCurrentPlayer();
        const activeCount = player.getActiveTokens().length;

        if (activeCount < 2) {
            const unlocks = validMoves.filter(m => m.type === 'unlock');
            if (unlocks.length > 0) {
                return this.randomMove(unlocks);
            }
        }

        // Random move
        return this.randomMove(validMoves);
    }
}
