/**
 * BoardRenderer - Renders the Ludo board
 */
import {
    BOARD_SIZE,
    MAIN_TRACK,
    HOME_PATHS,
    HOME_BASES,
    ENTRY_POINTS,
    SAFE_ZONES,
    PLAYER_ORDER,
    PLAYER_COLORS,
    getTrackIndex,
    isSafeZone
} from '../core/Constants.js';
import { eventBus, GameEvents } from '../core/EventBus.js';

export class BoardRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cells = new Map();
        this.homeBases = new Map();
        this.homeSlots = new Map();

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        eventBus.on(GameEvents.VALID_MOVES_UPDATE, (data) => this.highlightValidMoves(data.moves));
        eventBus.on(GameEvents.TOKEN_MOVE_COMPLETE, () => this.clearHighlights());
        eventBus.on(GameEvents.TURN_END, () => this.clearHighlights());
    }

    /**
     * Render the complete board
     */
    render() {
        this.container.innerHTML = '';

        // Create board grid
        this.renderHomeBases();
        this.renderTrack();
        this.renderHomePaths();
        this.renderCenter();
    }

    /**
     * Render home bases (corners)
     */
    renderHomeBases() {
        for (const color of PLAYER_ORDER) {
            const homeBase = document.createElement('div');
            homeBase.className = `home-base ${color.toLowerCase()}`;
            homeBase.dataset.color = color;

            // Create 4 token slots
            for (let i = 0; i < 4; i++) {
                const slot = document.createElement('div');
                slot.className = 'home-slot';
                slot.dataset.color = color;
                slot.dataset.slot = i;

                const pos = HOME_BASES[color][i];
                slot.dataset.row = pos.row;
                slot.dataset.col = pos.col;

                homeBase.appendChild(slot);
                this.homeSlots.set(`${color}_${i}`, slot);
            }

            this.container.appendChild(homeBase);
            this.homeBases.set(color, homeBase);
        }
    }

    /**
     * Render the main track cells
     */
    renderTrack() {
        for (let i = 0; i < MAIN_TRACK.length; i++) {
            const pos = MAIN_TRACK[i];
            const cell = this.createCell(pos.row, pos.col, 'track');

            // Mark safe zones
            if (isSafeZone(pos.row, pos.col)) {
                cell.classList.add('safe-zone');
            }

            // Mark entry points
            for (const [color, entryPos] of Object.entries(ENTRY_POINTS)) {
                if (entryPos.row === pos.row && entryPos.col === pos.col) {
                    cell.classList.add('entry-point', color.toLowerCase());
                }
            }

            cell.dataset.trackIndex = i;
            this.container.appendChild(cell);
            this.cells.set(`${pos.row}_${pos.col}`, cell);
        }
    }

    /**
     * Render home paths (colored paths to center)
     */
    renderHomePaths() {
        for (const [color, path] of Object.entries(HOME_PATHS)) {
            for (let i = 0; i < path.length; i++) {
                const pos = path[i];
                const cell = this.createCell(pos.row, pos.col, 'home-path');
                cell.classList.add(color.toLowerCase());
                cell.dataset.homePathColor = color;
                cell.dataset.homePathIndex = i;

                this.container.appendChild(cell);
                this.cells.set(`${pos.row}_${pos.col}`, cell);
            }
        }
    }

    /**
     * Render center zone
     */
    renderCenter() {
        const center = document.createElement('div');
        center.className = 'center-zone';

        // Create 4 triangles for each color
        const colors = ['red', 'green', 'yellow', 'blue'];
        for (const color of colors) {
            const triangle = document.createElement('div');
            triangle.className = `center-triangle ${color}`;
            center.appendChild(triangle);
        }

        this.container.appendChild(center);
    }

    /**
     * Create a board cell
     * @param {number} row
     * @param {number} col
     * @param {string} type
     * @returns {HTMLElement}
     */
    createCell(row, col, type) {
        const cell = document.createElement('div');
        cell.className = `board-cell ${type}`;
        cell.dataset.row = row;
        cell.dataset.col = col;

        // Position the cell using CSS Grid
        cell.style.gridRow = row + 1;
        cell.style.gridColumn = col + 1;

        return cell;
    }

    /**
     * Get cell element by position
     * @param {number} row
     * @param {number} col
     * @returns {HTMLElement|null}
     */
    getCell(row, col) {
        return this.cells.get(`${row}_${col}`) || null;
    }

    /**
     * Get home slot element
     * @param {string} color
     * @param {number} slot
     * @returns {HTMLElement|null}
     */
    getHomeSlot(color, slot) {
        return this.homeSlots.get(`${color}_${slot}`) || null;
    }

    /**
     * Highlight valid move cells
     * @param {Array} moves - Valid moves
     */
    highlightValidMoves(moves) {
        this.clearHighlights();

        for (const move of moves) {
            if (move.type === 'unlock') {
                // Highlight home slot
                const slot = this.getHomeSlot(move.token.color, move.token.homeSlot);
                if (slot) {
                    slot.classList.add('valid-move');
                }
            } else if (move.toPosition) {
                // Highlight destination cell
                const cell = this.getCell(move.toPosition.row, move.toPosition.col);
                if (cell) {
                    cell.classList.add('valid-move');
                }
            }
        }
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        document.querySelectorAll('.valid-move').forEach(el => {
            el.classList.remove('valid-move');
        });
    }

    /**
     * Flash a cell (for effects)
     * @param {number} row
     * @param {number} col
     * @param {string} color
     */
    flashCell(row, col, color) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.classList.add('glow-pulse');
            cell.style.color = PLAYER_COLORS[color]?.primary || color;
            setTimeout(() => {
                cell.classList.remove('glow-pulse');
            }, 800);
        }
    }
}
