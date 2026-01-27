/**
 * TokenRenderer - Renders and animates UFO tokens
 */
import { HOME_BASES, PLAYER_COLORS, ANIMATION_DURATIONS } from '../core/Constants.js';
import { eventBus, GameEvents } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class TokenRenderer {
    constructor(boardRenderer) {
        this.boardRenderer = boardRenderer;
        this.tokenElements = new Map();

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        eventBus.on(GameEvents.GAME_START, () => this.renderAllTokens());
        eventBus.on(GameEvents.TOKEN_UNLOCK, (data) => this.animateUnlock(data.token));
        eventBus.on(GameEvents.TOKEN_MOVE, (data) => this.animateMove(data.move, data.result));
        eventBus.on(GameEvents.TOKEN_CAPTURE, (data) => this.animateCapture(data.captured));
        eventBus.on(GameEvents.VALID_MOVES_UPDATE, (data) => this.highlightSelectableTokens(data.moves));
        eventBus.on(GameEvents.TURN_END, () => this.clearSelectableHighlights());
    }

    /**
     * Create a UFO token element
     * @param {Object} token - Token data
     * @returns {HTMLElement}
     */
    createTokenElement(token) {
        const ufo = document.createElement('div');
        ufo.className = `ufo-token ${token.color.toLowerCase()}`;
        ufo.dataset.tokenId = token.id;
        ufo.dataset.playerIndex = token.playerIndex;
        ufo.dataset.color = token.color;

        // UFO structure
        const dome = document.createElement('div');
        dome.className = 'ufo-dome';

        const body = document.createElement('div');
        body.className = 'ufo-body';

        const lights = document.createElement('div');
        lights.className = 'ufo-lights';
        for (let i = 0; i < 3; i++) {
            const light = document.createElement('span');
            light.className = 'ufo-light';
            lights.appendChild(light);
        }

        ufo.appendChild(dome);
        ufo.appendChild(body);
        ufo.appendChild(lights);

        // Click handler
        ufo.addEventListener('click', () => this.onTokenClick(token.id));

        return ufo;
    }

    /**
     * Render all tokens at their initial positions
     */
    renderAllTokens() {
        // Clear existing tokens
        this.tokenElements.forEach(el => el.remove());
        this.tokenElements.clear();

        // Create tokens for all players
        for (const player of gameState.players) {
            for (const token of player.tokens) {
                const element = this.createTokenElement(token);
                this.tokenElements.set(token.id, element);

                // Place in home slot
                const slot = this.boardRenderer.getHomeSlot(token.color, token.homeSlot);
                if (slot) {
                    slot.appendChild(element);
                }
            }
        }
    }

    /**
     * Get token element by ID
     * @param {string} tokenId
     * @returns {HTMLElement|null}
     */
    getTokenElement(tokenId) {
        return this.tokenElements.get(tokenId) || null;
    }

    /**
     * Handle token click
     * @param {string} tokenId
     */
    onTokenClick(tokenId) {
        const element = this.getTokenElement(tokenId);
        if (element && element.classList.contains('selectable')) {
            eventBus.emit(GameEvents.TOKEN_SELECT, { tokenId });
        }
    }

    /**
     * Move token to a cell
     * @param {string} tokenId
     * @param {number} row
     * @param {number} col
     */
    placeToken(tokenId, row, col) {
        const element = this.getTokenElement(tokenId);
        const cell = this.boardRenderer.getCell(row, col);

        if (element && cell) {
            cell.appendChild(element);
        }
    }

    /**
     * Move token to home slot
     * @param {string} tokenId
     * @param {string} color
     * @param {number} slot
     */
    placeTokenInHome(tokenId, color, slot) {
        const element = this.getTokenElement(tokenId);
        const homeSlot = this.boardRenderer.getHomeSlot(color, slot);

        if (element && homeSlot) {
            homeSlot.appendChild(element);
        }
    }

    /**
     * Animate token unlocking (moving from home to board)
     * @param {Object} token
     */
    async animateUnlock(token) {
        const element = this.getTokenElement(token.id);
        if (!element) return;

        element.classList.add('entering');

        // Move to entry point
        const cell = this.boardRenderer.getCell(token.position.row, token.position.col);
        if (cell) {
            await this.delay(50); // Small delay for animation start
            cell.appendChild(element);
        }

        await this.delay(ANIMATION_DURATIONS.TOKEN_ENTER);
        element.classList.remove('entering');
    }

    /**
     * Animate token movement
     * @param {Object} move
     * @param {Object} result
     */
    async animateMove(move, result) {
        const element = this.getTokenElement(move.tokenId);
        if (!element) return;

        element.classList.add('moving');

        // Animate through each position in path
        if (move.path && move.path.length > 0) {
            for (const pos of move.path) {
                const cell = this.boardRenderer.getCell(pos.row, pos.col);
                if (cell) {
                    cell.appendChild(element);
                    await this.delay(ANIMATION_DURATIONS.TOKEN_MOVE);
                }
            }
        } else if (result.newPosition) {
            const cell = this.boardRenderer.getCell(result.newPosition.row, result.newPosition.col);
            if (cell) {
                cell.appendChild(element);
                await this.delay(ANIMATION_DURATIONS.TOKEN_MOVE);
            }
        }

        element.classList.remove('moving');

        // Handle finish
        if (result.finished) {
            element.classList.add('finished');
            await this.delay(ANIMATION_DURATIONS.TOKEN_FINISH);
            element.style.display = 'none'; // Hide finished token
        }
    }

    /**
     * Animate token capture (send back to home)
     * @param {Object} token - Captured token
     */
    async animateCapture(token) {
        const element = this.getTokenElement(token.id);
        if (!element) return;

        element.classList.add('captured');
        await this.delay(ANIMATION_DURATIONS.TOKEN_CAPTURE);

        // Move back to home slot
        const slot = this.boardRenderer.getHomeSlot(token.color, token.homeSlot);
        if (slot) {
            element.classList.remove('captured');
            slot.appendChild(element);
        }
    }

    /**
     * Highlight selectable tokens
     * @param {Array} moves - Valid moves
     */
    highlightSelectableTokens(moves) {
        this.clearSelectableHighlights();

        const selectableIds = new Set(moves.map(m => m.tokenId));

        for (const [tokenId, element] of this.tokenElements) {
            if (selectableIds.has(tokenId)) {
                element.classList.add('selectable');
            }
        }
    }

    /**
     * Clear selectable highlights
     */
    clearSelectableHighlights() {
        for (const element of this.tokenElements.values()) {
            element.classList.remove('selectable', 'selected');
        }
    }

    /**
     * Select a token visually
     * @param {string} tokenId
     */
    selectToken(tokenId) {
        this.clearSelectableHighlights();
        const element = this.getTokenElement(tokenId);
        if (element) {
            element.classList.add('selected');
        }
    }

    /**
     * Utility delay function
     * @param {number} ms
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update token position based on game state
     * @param {Object} token
     */
    updateTokenPosition(token) {
        const element = this.getTokenElement(token.id);
        if (!element) return;

        if (token.state === 'home') {
            this.placeTokenInHome(token.id, token.color, token.homeSlot);
            element.style.display = '';
        } else if (token.state === 'active' && token.position) {
            this.placeToken(token.id, token.position.row, token.position.col);
            element.style.display = '';
        } else if (token.state === 'finished') {
            element.style.display = 'none';
        }
    }

    /**
     * Refresh all token positions from game state
     */
    refreshAllPositions() {
        for (const player of gameState.players) {
            for (const token of player.tokens) {
                this.updateTokenPosition(token);
            }
        }
    }
}
