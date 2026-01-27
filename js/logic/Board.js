/**
 * Board - Board representation and path calculations
 */
import {
    BOARD_SIZE,
    MAIN_TRACK,
    HOME_PATHS,
    HOME_BASES,
    ENTRY_POINTS,
    SAFE_ZONES,
    TRACK_ENTRY_INDICES,
    HOME_PATH_ENTRY_INDICES,
    TRACK_LENGTH,
    isSafeZone,
    getTrackIndex
} from '../core/Constants.js';

export class Board {
    constructor() {
        // Initialize board grid
        this.grid = this.createGrid();

        // Token positions map (for quick lookup)
        this.tokenPositions = new Map();
    }

    /**
     * Create the board grid structure
     * @returns {Array} 2D grid array
     */
    createGrid() {
        const grid = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
            grid[row] = [];
            for (let col = 0; col < BOARD_SIZE; col++) {
                grid[row][col] = this.getCellType(row, col);
            }
        }

        return grid;
    }

    /**
     * Determine the type of cell at given position
     * @param {number} row
     * @param {number} col
     * @returns {Object} Cell type info
     */
    getCellType(row, col) {
        // Check home bases
        for (const [color, positions] of Object.entries(HOME_BASES)) {
            if (positions.some(p => p.row === row && p.col === col)) {
                return { type: 'home-base', color: color.toLowerCase() };
            }
        }

        // Check entry points
        for (const [color, pos] of Object.entries(ENTRY_POINTS)) {
            if (pos.row === row && pos.col === col) {
                return { type: 'entry-point', color: color.toLowerCase() };
            }
        }

        // Check home paths
        for (const [color, path] of Object.entries(HOME_PATHS)) {
            const idx = path.findIndex(p => p.row === row && p.col === col);
            if (idx !== -1) {
                return {
                    type: 'home-path',
                    color: color.toLowerCase(),
                    index: idx,
                    isFinal: idx === path.length - 1
                };
            }
        }

        // Check main track
        const trackIdx = getTrackIndex(row, col);
        if (trackIdx !== -1) {
            const isSafe = isSafeZone(row, col);
            return {
                type: 'track',
                trackIndex: trackIdx,
                isSafeZone: isSafe
            };
        }

        // Check center zone
        if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
            return { type: 'center' };
        }

        // Empty cell
        return { type: 'empty' };
    }

    /**
     * Get cell info at position
     * @param {number} row
     * @param {number} col
     * @returns {Object}
     */
    getCell(row, col) {
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
            return null;
        }
        return this.grid[row][col];
    }

    /**
     * Check if position is a safe zone
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    isSafeZone(row, col) {
        return isSafeZone(row, col);
    }

    /**
     * Check if position is an entry point
     * @param {number} row
     * @param {number} col
     * @returns {string|null} Color or null
     */
    isEntryPoint(row, col) {
        for (const [color, pos] of Object.entries(ENTRY_POINTS)) {
            if (pos.row === row && pos.col === col) {
                return color;
            }
        }
        return null;
    }

    /**
     * Check if position is on home path
     * @param {number} row
     * @param {number} col
     * @returns {Object|null}
     */
    isHomePath(row, col) {
        for (const [color, path] of Object.entries(HOME_PATHS)) {
            const idx = path.findIndex(p => p.row === row && p.col === col);
            if (idx !== -1) {
                return { color, index: idx };
            }
        }
        return null;
    }

    /**
     * Get track position by index
     * @param {number} index
     * @returns {Object} {row, col}
     */
    getTrackPosition(index) {
        const normalizedIndex = ((index % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
        return MAIN_TRACK[normalizedIndex];
    }

    /**
     * Get home path position
     * @param {string} color
     * @param {number} index
     * @returns {Object|null} {row, col}
     */
    getHomePathPosition(color, index) {
        const path = HOME_PATHS[color];
        if (!path || index < 0 || index >= path.length) {
            return null;
        }
        return path[index];
    }

    /**
     * Get home base position
     * @param {string} color
     * @param {number} slot
     * @returns {Object} {row, col}
     */
    getHomeBasePosition(color, slot) {
        return HOME_BASES[color][slot];
    }

    /**
     * Calculate distance between two track positions
     * @param {number} fromIndex
     * @param {number} toIndex
     * @returns {number}
     */
    getTrackDistance(fromIndex, toIndex) {
        if (toIndex >= fromIndex) {
            return toIndex - fromIndex;
        }
        return (TRACK_LENGTH - fromIndex) + toIndex;
    }

    /**
     * Check if path from one position to another is clear
     * @param {number} fromIndex
     * @param {number} steps
     * @param {Array} occupiedPositions - Positions to consider blocked
     * @returns {boolean}
     */
    isPathClear(fromIndex, steps, occupiedPositions = []) {
        for (let i = 1; i <= steps; i++) {
            const idx = (fromIndex + i) % TRACK_LENGTH;
            const pos = MAIN_TRACK[idx];
            if (occupiedPositions.some(p => p.row === pos.row && p.col === pos.col)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Register a token position
     * @param {string} tokenId
     * @param {Object} position - {row, col}
     */
    setTokenPosition(tokenId, position) {
        this.tokenPositions.set(tokenId, position);
    }

    /**
     * Remove a token position
     * @param {string} tokenId
     */
    removeTokenPosition(tokenId) {
        this.tokenPositions.delete(tokenId);
    }

    /**
     * Get tokens at a position
     * @param {number} row
     * @param {number} col
     * @returns {Array<string>} Array of token IDs
     */
    getTokensAt(row, col) {
        const tokens = [];
        for (const [tokenId, pos] of this.tokenPositions) {
            if (pos.row === row && pos.col === col) {
                tokens.push(tokenId);
            }
        }
        return tokens;
    }

    /**
     * Clear all token positions
     */
    clearTokenPositions() {
        this.tokenPositions.clear();
    }

    /**
     * Get all safe zone positions
     * @returns {Array}
     */
    getSafeZones() {
        return SAFE_ZONES;
    }

    /**
     * Get all track positions
     * @returns {Array}
     */
    getTrackPositions() {
        return MAIN_TRACK;
    }

    /**
     * Get board dimensions
     * @returns {Object}
     */
    getDimensions() {
        return { rows: BOARD_SIZE, cols: BOARD_SIZE };
    }

    /**
     * Generate board layout data for rendering
     * @returns {Array}
     */
    getLayoutData() {
        const layout = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = this.grid[row][col];
                if (cell.type !== 'empty') {
                    layout.push({
                        row,
                        col,
                        ...cell
                    });
                }
            }
        }

        return layout;
    }
}

// Create singleton instance
export const board = new Board();
