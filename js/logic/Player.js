/**
 * Player - Represents a game player (human or AI)
 */
import { Token } from './Token.js';
import { PLAYER_ORDER, PLAYER_COLORS, TOKENS_PER_PLAYER } from '../core/Constants.js';

export class Player {
    constructor(index, config = {}) {
        this.id = index;
        this.index = index;
        this.color = PLAYER_ORDER[index];
        this.colorData = PLAYER_COLORS[this.color];

        this.name = config.name || `Player ${index + 1}`;
        this.isAI = config.isAI || false;
        this.aiDifficulty = config.aiDifficulty || 'MEDIUM';

        // Initialize tokens
        this.tokens = [];
        for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
            this.tokens.push(new Token(index, i));
        }

        // Stats
        this.finishedTokens = 0;
        this.captures = 0;
        this.totalMoves = 0;
        this.sixesRolled = 0;
    }

    /**
     * Get token by index
     * @param {number} tokenIndex - Token index (0-3)
     * @returns {Token}
     */
    getToken(tokenIndex) {
        return this.tokens[tokenIndex];
    }

    /**
     * Get token by ID
     * @param {string} tokenId - Token ID
     * @returns {Token|null}
     */
    getTokenById(tokenId) {
        return this.tokens.find(t => t.id === tokenId) || null;
    }

    /**
     * Get all tokens at home
     * @returns {Array<Token>}
     */
    getHomeTokens() {
        return this.tokens.filter(t => t.isAtHome());
    }

    /**
     * Get all active tokens (on board)
     * @returns {Array<Token>}
     */
    getActiveTokens() {
        return this.tokens.filter(t => t.isActive());
    }

    /**
     * Get all finished tokens
     * @returns {Array<Token>}
     */
    getFinishedTokens() {
        return this.tokens.filter(t => t.isFinished());
    }

    /**
     * Check if player has won
     * @returns {boolean}
     */
    hasWon() {
        return this.finishedTokens >= TOKENS_PER_PLAYER;
    }

    /**
     * Check if player can make any move with given dice value
     * @param {number} diceValue - Dice value
     * @returns {boolean}
     */
    canMove(diceValue) {
        // Check if can unlock a token
        if (diceValue === 6 && this.getHomeTokens().length > 0) {
            return true;
        }

        // Check if any active token can move
        for (const token of this.getActiveTokens()) {
            const result = token.calculateMove(diceValue);
            if (result.valid) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all valid moves for given dice value
     * @param {number} diceValue - Dice value
     * @param {Function} checkCapture - Function to check if move results in capture
     * @returns {Array} Array of move objects
     */
    getValidMoves(diceValue, checkCapture = null) {
        const moves = [];

        // Check unlock moves (dice = 6)
        if (diceValue === 6) {
            for (const token of this.getHomeTokens()) {
                moves.push({
                    type: 'unlock',
                    token: token,
                    tokenId: token.id,
                    diceValue: diceValue
                });
            }
        }

        // Check movement moves for active tokens
        for (const token of this.getActiveTokens()) {
            const result = token.calculateMove(diceValue);
            if (result.valid) {
                const move = {
                    type: result.finished ? 'finish' : 'move',
                    token: token,
                    tokenId: token.id,
                    diceValue: diceValue,
                    fromPosition: { ...token.position },
                    toPosition: result.newPosition,
                    finished: result.finished,
                    entersHomePath: result.entersHomePath || false,
                    path: result.path
                };

                // Check for capture
                if (checkCapture && !result.finished && !token.isOnHomePath()) {
                    const captureResult = checkCapture(result.newPosition, this.index);
                    if (captureResult) {
                        move.type = 'capture';
                        move.capturedToken = captureResult;
                    }
                }

                moves.push(move);
            }
        }

        return moves;
    }

    /**
     * Update token state after unlock
     * @param {string} tokenId - Token ID
     */
    unlockToken(tokenId) {
        const token = this.getTokenById(tokenId);
        if (token && token.isAtHome()) {
            token.enterBoard();
        }
    }

    /**
     * Update token after movement
     * @param {string} tokenId - Token ID
     * @param {number} steps - Steps to move
     * @returns {Object} Move result
     */
    moveToken(tokenId, steps) {
        const token = this.getTokenById(tokenId);
        if (!token) return { success: false };

        const result = token.move(steps);
        if (result.valid && result.finished) {
            this.finishedTokens++;
        }

        this.totalMoves++;
        return result;
    }

    /**
     * Send a token back home (when captured)
     * @param {string} tokenId - Token ID
     */
    captureToken(tokenId) {
        const token = this.getTokenById(tokenId);
        if (token) {
            token.sendHome();
        }
    }

    /**
     * Record a capture made by this player
     */
    recordCapture() {
        this.captures++;
    }

    /**
     * Record a six rolled
     */
    recordSix() {
        this.sixesRolled++;
    }

    /**
     * Get player's overall progress (average of all tokens)
     * @returns {number} Progress from 0 to 1
     */
    getOverallProgress() {
        const totalProgress = this.tokens.reduce((sum, t) => sum + t.getProgress(), 0);
        return totalProgress / TOKENS_PER_PLAYER;
    }

    /**
     * Clone the player for simulation
     * @returns {Player}
     */
    clone() {
        const cloned = new Player(this.index, {
            name: this.name,
            isAI: this.isAI,
            aiDifficulty: this.aiDifficulty
        });
        cloned.tokens = this.tokens.map(t => t.clone());
        cloned.finishedTokens = this.finishedTokens;
        cloned.captures = this.captures;
        cloned.totalMoves = this.totalMoves;
        cloned.sixesRolled = this.sixesRolled;
        return cloned;
    }

    /**
     * Get a plain object representation
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            index: this.index,
            color: this.color,
            name: this.name,
            isAI: this.isAI,
            aiDifficulty: this.aiDifficulty,
            tokens: this.tokens.map(t => t.toObject()),
            finishedTokens: this.finishedTokens,
            captures: this.captures,
            totalMoves: this.totalMoves,
            sixesRolled: this.sixesRolled
        };
    }
}
