/**
 * MediumAI - Balanced AI using heuristics
 */
import { AI_DIFFICULTY } from '../core/Constants.js';
import { Heuristics } from './Heuristics.js';

export class MediumAI {
    constructor() {
        this.randomness = AI_DIFFICULTY.MEDIUM.randomness;
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

        // Small chance of random move
        if (Math.random() < this.randomness) {
            return this.randomMove(validMoves);
        }

        // Evaluate all moves using heuristics
        return this.heuristicStrategy(validMoves, gameState);
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
     * Use heuristics to select best move
     * @param {Array} validMoves
     * @param {Object} gameState
     * @returns {Object}
     */
    heuristicStrategy(validMoves, gameState) {
        let bestMove = validMoves[0];
        let bestScore = -Infinity;

        for (const move of validMoves) {
            const score = Heuristics.evaluateMove(move, gameState);

            // Add small random factor to avoid predictability
            const adjustedScore = score + (Math.random() * 10);

            if (adjustedScore > bestScore) {
                bestScore = adjustedScore;
                bestMove = move;
            }
        }

        return bestMove;
    }

    /**
     * Get all moves with their scores
     * @param {Array} validMoves
     * @param {Object} gameState
     * @returns {Array} Array of {move, score} objects
     */
    getMovesWithScores(validMoves, gameState) {
        return validMoves.map(move => ({
            move,
            score: Heuristics.evaluateMove(move, gameState)
        })).sort((a, b) => b.score - a.score);
    }
}
