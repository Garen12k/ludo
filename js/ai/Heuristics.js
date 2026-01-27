/**
 * Heuristics - Move evaluation functions for AI
 */
import {
    isSafeZone,
    MAIN_TRACK,
    HOME_PATHS,
    TRACK_LENGTH,
    TRACK_ENTRY_INDICES
} from '../core/Constants.js';

export class Heuristics {
    // Weight constants for move evaluation
    static WEIGHTS = {
        CAPTURE: 100,           // Capturing opponent token
        FINISH: 150,            // Getting token to finish
        UNLOCK: 60,             // Getting token out of home
        ENTER_HOME_PATH: 80,    // Entering home stretch
        REACH_SAFE: 40,         // Landing on safe zone
        ESCAPE_DANGER: 50,      // Moving out of danger
        ADVANCE: 1,             // Per step advancement
        BLOCK_OPPONENT: 30,     // Block opponent's entry
        PROTECT_LEAD: 20,       // Protect token close to finish
        SPREAD_TOKENS: 15       // Having tokens spread out
    };

    /**
     * Evaluate a move and return a score
     * @param {Object} move - Move to evaluate
     * @param {Object} gameState - Current game state
     * @returns {number} Score for the move
     */
    static evaluateMove(move, gameState) {
        let score = 0;
        const player = gameState.getCurrentPlayer();

        // Base score by move type
        switch (move.type) {
            case 'capture':
                score += this.WEIGHTS.CAPTURE;
                // Extra points for capturing advanced tokens
                if (move.capturedToken) {
                    score += move.capturedToken.totalSteps * 0.5;
                }
                break;

            case 'finish':
                score += this.WEIGHTS.FINISH;
                break;

            case 'unlock':
                score += this.WEIGHTS.UNLOCK;
                // Bonus if few tokens on board
                const activeCount = player.getActiveTokens().length;
                if (activeCount === 0) {
                    score += 40; // High priority to get first token out
                } else if (activeCount === 1) {
                    score += 20;
                }
                break;

            case 'move':
                // Base advancement score
                score += move.diceValue * this.WEIGHTS.ADVANCE;
                break;
        }

        // Bonus for entering home path
        if (move.entersHomePath) {
            score += this.WEIGHTS.ENTER_HOME_PATH;
        }

        // Bonus for landing on safe zone
        if (move.toPosition && isSafeZone(move.toPosition.row, move.toPosition.col)) {
            score += this.WEIGHTS.REACH_SAFE;
        }

        // Bonus for escaping danger
        if (move.fromPosition && this.isInDanger(move.fromPosition, player.index, gameState)) {
            score += this.WEIGHTS.ESCAPE_DANGER;
        }

        // Bonus for protecting lead (token close to finish)
        if (move.token && move.token.isOnHomePath()) {
            score += this.WEIGHTS.PROTECT_LEAD;
        }

        // Penalty for moving into danger
        if (move.toPosition && !isSafeZone(move.toPosition.row, move.toPosition.col)) {
            if (this.isInDanger(move.toPosition, player.index, gameState)) {
                score -= 30;
            }
        }

        return score;
    }

    /**
     * Check if a position is in danger (opponent can capture)
     * @param {Object} position - {row, col}
     * @param {number} playerIndex - Current player index
     * @param {Object} gameState - Game state
     * @returns {boolean}
     */
    static isInDanger(position, playerIndex, gameState) {
        if (isSafeZone(position.row, position.col)) {
            return false;
        }

        // Find position on track
        const trackIndex = MAIN_TRACK.findIndex(
            p => p.row === position.row && p.col === position.col
        );

        if (trackIndex === -1) {
            return false; // Not on main track (home path)
        }

        // Check all opponent tokens
        for (const player of gameState.players) {
            if (player.index === playerIndex) continue;

            for (const token of player.getActiveTokens()) {
                if (token.trackIndex === -1) continue;

                // Check if opponent is within 6 spaces behind
                let distance;
                if (token.trackIndex <= trackIndex) {
                    distance = trackIndex - token.trackIndex;
                } else {
                    distance = (TRACK_LENGTH - token.trackIndex) + trackIndex;
                }

                if (distance > 0 && distance <= 6) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Evaluate board state for a player
     * @param {Object} player - Player to evaluate
     * @param {Object} gameState - Game state
     * @returns {number} Board state score
     */
    static evaluateBoardState(player, gameState) {
        let score = 0;

        // Finished tokens (highest value)
        score += player.finishedTokens * 1000;

        // Active tokens progress
        for (const token of player.tokens) {
            if (token.state === 'finished') {
                continue;
            } else if (token.state === 'active') {
                // Progress score
                score += token.totalSteps * 5;

                // Bonus for being on home path
                if (token.isOnHomePath()) {
                    score += 100 + (token.homePathIndex * 20);
                }

                // Bonus for being on safe zone
                if (token.position && isSafeZone(token.position.row, token.position.col)) {
                    score += 30;
                }

                // Penalty for being in danger
                if (token.position && this.isInDanger(token.position, player.index, gameState)) {
                    score -= 40;
                }
            }
            // Tokens at home add no score
        }

        return score;
    }

    /**
     * Get threat level at a position
     * @param {Object} position
     * @param {number} playerIndex
     * @param {Object} gameState
     * @returns {number} Threat level (0-6, where 6 is immediate threat)
     */
    static getThreatLevel(position, playerIndex, gameState) {
        if (isSafeZone(position.row, position.col)) {
            return 0;
        }

        const trackIndex = MAIN_TRACK.findIndex(
            p => p.row === position.row && p.col === position.col
        );

        if (trackIndex === -1) return 0;

        let maxThreat = 0;

        for (const player of gameState.players) {
            if (player.index === playerIndex) continue;

            for (const token of player.getActiveTokens()) {
                if (token.trackIndex === -1) continue;

                let distance;
                if (token.trackIndex <= trackIndex) {
                    distance = trackIndex - token.trackIndex;
                } else {
                    distance = (TRACK_LENGTH - token.trackIndex) + trackIndex;
                }

                if (distance > 0 && distance <= 6) {
                    const threat = 7 - distance; // Closer = higher threat
                    maxThreat = Math.max(maxThreat, threat);
                }
            }
        }

        return maxThreat;
    }

    /**
     * Count tokens at risk for a player
     * @param {Object} player
     * @param {Object} gameState
     * @returns {number}
     */
    static countTokensAtRisk(player, gameState) {
        let count = 0;
        for (const token of player.getActiveTokens()) {
            if (token.position && this.isInDanger(token.position, player.index, gameState)) {
                count++;
            }
        }
        return count;
    }
}
