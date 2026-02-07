/**
 * Rules - Ludo game rules engine
 */
import {
    UNLOCK_VALUE,
    MAX_CONSECUTIVE_SIXES,
    SAFE_ZONES,
    MAIN_TRACK,
    HOME_PATHS,
    ENTRY_POINTS,
    TRACK_ENTRY_INDICES,
    isSafeZone
} from '../core/Constants.js';
import { board } from './Board.js';

export class Rules {
    /**
     * Check if a token can be unlocked from home
     * @param {number} diceValue
     * @returns {boolean}
     */
    static canUnlock(diceValue) {
        return diceValue === UNLOCK_VALUE;
    }

    /**
     * Check if a token can move with given dice value
     * @param {Object} token - Token object
     * @param {number} diceValue - Dice value
     * @returns {Object} {canMove: boolean, reason?: string}
     */
    static canMove(token, diceValue) {
        // Token at home can only move if dice is 6
        if (token.state === 'home') {
            if (diceValue === UNLOCK_VALUE) {
                return { canMove: true, type: 'unlock' };
            }
            return { canMove: false, reason: 'Need 6 to unlock' };
        }

        // Finished tokens can't move
        if (token.state === 'finished') {
            return { canMove: false, reason: 'Token already finished' };
        }

        // Check if move is valid (doesn't overshoot)
        const moveResult = token.calculateMove(diceValue);
        if (!moveResult.valid) {
            return { canMove: false, reason: moveResult.reason };
        }

        return { canMove: true, type: moveResult.finished ? 'finish' : 'move' };
    }

    /**
     * Get all valid moves for a player
     * @param {Object} player - Player object
     * @param {number} diceValue - Dice value
     * @param {Array} allPlayers - All players for capture checking
     * @returns {Array} Array of valid move objects
     */
    static getValidMoves(player, diceValue, allPlayers) {
        const moves = [];

        // Check unlock moves (dice = 6)
        if (diceValue === UNLOCK_VALUE) {
            const homeTokens = player.getHomeTokens();
            for (const token of homeTokens) {
                // Check if entry point is blocked by own token
                const entryPos = ENTRY_POINTS[token.color];
                const tokensAtEntry = this.getTokensAtPosition(entryPos.row, entryPos.col, allPlayers);
                const ownTokenAtEntry = tokensAtEntry.find(t => t.playerIndex === player.index);

                // Can still unlock even if own token is there (will stack)
                moves.push({
                    type: 'unlock',
                    token: token,
                    tokenId: token.id,
                    diceValue: diceValue,
                    toPosition: { ...entryPos }
                });
            }
        }

        // Check movement moves for active tokens
        const activeTokens = player.getActiveTokens();
        for (const token of activeTokens) {
            const moveResult = token.calculateMove(diceValue);
            if (!moveResult.valid) continue;

            const move = {
                type: moveResult.finished ? 'finish' : 'move',
                token: token,
                tokenId: token.id,
                diceValue: diceValue,
                fromPosition: { ...token.position },
                toPosition: moveResult.newPosition,
                path: moveResult.path,
                finished: moveResult.finished,
                entersHomePath: moveResult.entersHomePath || false
            };

            // Check for capture (only on main track, not safe zones or home path)
            if (!moveResult.finished && !this.isOnHomePath(moveResult.newPosition)) {
                const captureTarget = this.checkCapture(
                    moveResult.newPosition,
                    player.index,
                    allPlayers
                );

                if (captureTarget) {
                    move.type = 'capture';
                    move.capturedToken = captureTarget;
                }
            }

            moves.push(move);
        }

        return moves;
    }

    /**
     * Check if a position is on any player's home path
     * @param {Object} position - {row, col}
     * @returns {boolean}
     */
    static isOnHomePath(position) {
        for (const path of Object.values(HOME_PATHS)) {
            if (path.some(p => p.row === position.row && p.col === position.col)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if moving to a position would capture an opponent
     * @param {Object} position - Target position {row, col}
     * @param {number} playerIndex - Moving player's index
     * @param {Array} allPlayers - All players
     * @returns {Object|null} Captured token or null
     */
    static checkCapture(position, playerIndex, allPlayers) {
        // Can't capture on safe zones
        if (isSafeZone(position.row, position.col)) {
            return null;
        }

        // Can't capture on entry points (where tokens leave home)
        for (const entryPoint of Object.values(ENTRY_POINTS)) {
            if (entryPoint.row === position.row && entryPoint.col === position.col) {
                return null;
            }
        }

        // Check for opponent tokens at position
        for (const player of allPlayers) {
            if (player.index === playerIndex) continue;

            for (const token of player.getActiveTokens()) {
                if (token.position &&
                    token.position.row === position.row &&
                    token.position.col === position.col &&
                    !token.isOnHomePath()) {
                    return token;
                }
            }
        }

        return null;
    }

    /**
     * Get all tokens at a position
     * @param {number} row
     * @param {number} col
     * @param {Array} allPlayers
     * @returns {Array}
     */
    static getTokensAtPosition(row, col, allPlayers) {
        const tokens = [];
        for (const player of allPlayers) {
            for (const token of player.getActiveTokens()) {
                if (token.position &&
                    token.position.row === row &&
                    token.position.col === col) {
                    tokens.push(token);
                }
            }
        }
        return tokens;
    }

    /**
     * Check if player can roll again (rolled a 6)
     * @param {number} diceValue
     * @param {number} consecutiveSixes
     * @returns {boolean}
     */
    static canRollAgain(diceValue, consecutiveSixes) {
        return diceValue === UNLOCK_VALUE && consecutiveSixes < MAX_CONSECUTIVE_SIXES;
    }

    /**
     * Check if turn is forfeited (3 consecutive sixes)
     * @param {number} consecutiveSixes
     * @returns {boolean}
     */
    static isTurnForfeited(consecutiveSixes) {
        return consecutiveSixes >= MAX_CONSECUTIVE_SIXES;
    }

    /**
     * Check if player has won (all tokens finished)
     * @param {Object} player
     * @returns {boolean}
     */
    static hasWon(player) {
        return player.hasWon();
    }

    /**
     * Check if a position is safe (safe zone or entry point for that color)
     * @param {number} row
     * @param {number} col
     * @param {string} color - Player color
     * @returns {boolean}
     */
    static isSafePosition(row, col, color) {
        // Check safe zones
        if (isSafeZone(row, col)) {
            return true;
        }

        // Check if it's the player's entry point
        const entryPoint = ENTRY_POINTS[color];
        if (entryPoint.row === row && entryPoint.col === col) {
            return true;
        }

        return false;
    }

    /**
     * Validate a move before execution
     * @param {Object} move - Move object
     * @param {Object} gameState - Current game state
     * @returns {Object} {valid: boolean, reason?: string}
     */
    static validateMove(move, gameState) {
        const player = gameState.getCurrentPlayer();
        const token = player.getTokenById(move.tokenId);

        if (!token) {
            return { valid: false, reason: 'Token not found' };
        }

        // Verify it's this player's token
        if (token.playerIndex !== player.index) {
            return { valid: false, reason: 'Not your token' };
        }

        // Verify dice value matches
        if (move.diceValue !== gameState.diceValue) {
            return { valid: false, reason: 'Dice value mismatch' };
        }

        // Verify move type
        if (move.type === 'unlock') {
            if (!this.canUnlock(move.diceValue)) {
                return { valid: false, reason: 'Cannot unlock without 6' };
            }
            if (token.state !== 'home') {
                return { valid: false, reason: 'Token not at home' };
            }
        } else {
            if (token.state !== 'active') {
                return { valid: false, reason: 'Token not active' };
            }
            const canMoveResult = this.canMove(token, move.diceValue);
            if (!canMoveResult.canMove) {
                return { valid: false, reason: canMoveResult.reason };
            }
        }

        return { valid: true };
    }

    /**
     * Execute a move (update game state)
     * @param {Object} move - Move object
     * @param {Object} gameState - Game state to modify
     * @returns {Object} Result of move execution
     */
    static executeMove(move, gameState) {
        const player = gameState.getCurrentPlayer();
        const token = player.getTokenById(move.tokenId);

        const result = {
            success: true,
            move: move,
            captured: null,
            finished: false,
            extraTurn: false
        };

        if (move.type === 'unlock') {
            // Move token from home to entry point
            token.enterBoard();
            result.newPosition = { ...token.position };
        } else {
            // Move token on the board
            const moveResult = token.move(move.diceValue);
            result.newPosition = token.position ? { ...token.position } : null;
            result.finished = moveResult.finished;

            if (result.finished) {
                player.finishedTokens++;
            }

            // Handle capture
            if (move.type === 'capture' && move.capturedToken) {
                const capturedPlayer = gameState.getPlayer(move.capturedToken.playerIndex);
                capturedPlayer.captureToken(move.capturedToken.id);
                player.recordCapture();
                result.captured = move.capturedToken;
                result.extraTurn = true; // Extra turn for capture
            }
        }

        // Record the move
        gameState.recordMove({
            player: player.index,
            tokenId: move.tokenId,
            type: move.type,
            from: move.fromPosition,
            to: result.newPosition,
            diceValue: move.diceValue,
            captured: result.captured
        });

        // Check for extra turn (rolled 6 or captured)
        if (gameState.diceValue === UNLOCK_VALUE && !gameState.isTurnForfeited()) {
            result.extraTurn = true;
        }

        return result;
    }

    /**
     * Get move priority for AI (higher = better)
     * @param {Object} move - Move object
     * @returns {number} Priority score
     */
    static getMovePriority(move) {
        let priority = 0;

        switch (move.type) {
            case 'capture':
                priority += 100; // Highest priority - capture opponent
                break;
            case 'finish':
                priority += 90; // Very high - finish a token
                break;
            case 'unlock':
                priority += 70; // High - get more tokens on board
                break;
            case 'move':
                priority += 10; // Base move
                break;
        }

        // Bonus for entering home path
        if (move.entersHomePath) {
            priority += 30;
        }

        // Bonus for moving to safe zone
        if (move.toPosition && isSafeZone(move.toPosition.row, move.toPosition.col)) {
            priority += 20;
        }

        return priority;
    }
}
