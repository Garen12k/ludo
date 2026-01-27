/**
 * HardAI - Advanced AI with deeper analysis
 */
import { AI_DIFFICULTY, TRACK_LENGTH, isSafeZone } from '../core/Constants.js';
import { Heuristics } from './Heuristics.js';

export class HardAI {
    constructor() {
        this.randomness = AI_DIFFICULTY.HARD.randomness;
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

        // Very small chance of random move (to be less predictable)
        if (Math.random() < this.randomness) {
            return this.randomMove(validMoves);
        }

        // Use advanced strategy
        return this.advancedStrategy(validMoves, gameState);
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
     * Advanced strategy with multiple considerations
     * @param {Array} validMoves
     * @param {Object} gameState
     * @returns {Object}
     */
    advancedStrategy(validMoves, gameState) {
        const player = gameState.getCurrentPlayer();
        const scoredMoves = [];

        for (const move of validMoves) {
            let score = Heuristics.evaluateMove(move, gameState);

            // Additional strategic considerations

            // 1. Consider opponent threats after move
            if (move.toPosition) {
                const futureRisk = this.evaluateFutureRisk(move.toPosition, player.index, gameState);
                score -= futureRisk * 15;
            }

            // 2. Consider game phase (early, mid, late)
            const gamePhase = this.getGamePhase(gameState);
            score += this.adjustForGamePhase(move, gamePhase, player);

            // 3. Consider if move enables opponent captures
            if (move.type === 'unlock') {
                const entryRisk = this.evaluateEntryPointRisk(player, gameState);
                score -= entryRisk * 10;
            }

            // 4. Prioritize tokens close to finish
            if (move.token && move.token.isOnHomePath()) {
                score += (move.token.homePathIndex + 1) * 15;
            }

            // 5. Balance between aggression and defense
            const tokensAtRisk = Heuristics.countTokensAtRisk(player, gameState);
            if (tokensAtRisk > 1) {
                // Prioritize defensive moves when multiple tokens at risk
                if (move.toPosition && this.isSafeDestination(move.toPosition)) {
                    score += 25;
                }
            }

            scoredMoves.push({ move, score });
        }

        // Sort by score and return best
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0].move;
    }

    /**
     * Evaluate risk of a position in the future
     * @param {Object} position
     * @param {number} playerIndex
     * @param {Object} gameState
     * @returns {number} Risk score
     */
    evaluateFutureRisk(position, playerIndex, gameState) {
        // Calculate probability of being captured
        const threatLevel = Heuristics.getThreatLevel(position, playerIndex, gameState);
        return threatLevel; // 0-6 scale
    }

    /**
     * Determine game phase
     * @param {Object} gameState
     * @returns {string} 'early', 'mid', or 'late'
     */
    getGamePhase(gameState) {
        let totalProgress = 0;
        let totalTokens = 0;

        for (const player of gameState.players) {
            totalProgress += player.getOverallProgress();
            totalTokens += player.finishedTokens;
        }

        const avgProgress = totalProgress / gameState.players.length;

        if (avgProgress < 0.25 || totalTokens < 2) {
            return 'early';
        } else if (avgProgress < 0.6 || totalTokens < 8) {
            return 'mid';
        }
        return 'late';
    }

    /**
     * Adjust score based on game phase
     * @param {Object} move
     * @param {string} phase
     * @param {Object} player
     * @returns {number} Score adjustment
     */
    adjustForGamePhase(move, phase, player) {
        let adjustment = 0;

        switch (phase) {
            case 'early':
                // Prioritize getting tokens out
                if (move.type === 'unlock') {
                    adjustment += 30;
                }
                // Less aggressive captures (focus on spreading)
                if (move.type === 'capture') {
                    adjustment -= 10;
                }
                break;

            case 'mid':
                // Balanced play - prioritize captures
                if (move.type === 'capture') {
                    adjustment += 20;
                }
                // Start considering finishing
                if (move.entersHomePath) {
                    adjustment += 25;
                }
                break;

            case 'late':
                // Prioritize finishing above all
                if (move.type === 'finish') {
                    adjustment += 50;
                }
                if (move.entersHomePath) {
                    adjustment += 40;
                }
                // Still value captures highly
                if (move.type === 'capture') {
                    adjustment += 30;
                }
                break;
        }

        return adjustment;
    }

    /**
     * Evaluate risk at entry point
     * @param {Object} player
     * @param {Object} gameState
     * @returns {number}
     */
    evaluateEntryPointRisk(player, gameState) {
        // Check how many opponent tokens are near our entry point
        const entryIndex = player.tokens[0].getEntryIndex();
        let risk = 0;

        for (const opponent of gameState.players) {
            if (opponent.index === player.index) continue;

            for (const token of opponent.getActiveTokens()) {
                if (token.trackIndex === -1) continue;

                let distance;
                if (token.trackIndex <= entryIndex) {
                    distance = entryIndex - token.trackIndex;
                } else {
                    distance = (TRACK_LENGTH - token.trackIndex) + entryIndex;
                }

                if (distance > 0 && distance <= 6) {
                    risk += (7 - distance);
                }
            }
        }

        return risk;
    }

    /**
     * Check if destination is safe
     * @param {Object} position
     * @returns {boolean}
     */
    isSafeDestination(position) {
        // Check if on safe zone or home path
        return isSafeZone(position.row, position.col);
    }
}
