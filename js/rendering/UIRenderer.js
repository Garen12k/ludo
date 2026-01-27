/**
 * UIRenderer - Handles UI updates and screens
 */
import { PLAYER_ORDER, PLAYER_COLORS, ANIMATION_DURATIONS } from '../core/Constants.js';
import { eventBus, GameEvents } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class UIRenderer {
    constructor() {
        // Screens
        this.mainMenu = document.getElementById('main-menu');
        this.setupScreen = document.getElementById('setup-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.victoryOverlay = document.getElementById('victory-overlay');

        // Player info elements
        this.playerInfoElements = document.querySelectorAll('.player-info');

        // Announcement
        this.announcement = document.getElementById('turn-announcement');
        this.announcementText = this.announcement.querySelector('.announcement-text');

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        eventBus.on(GameEvents.GAME_START, () => this.onGameStart());
        eventBus.on(GameEvents.TURN_START, (data) => this.onTurnStart(data.player));
        eventBus.on(GameEvents.PLAYER_WIN, (data) => this.showVictory(data.player));
        eventBus.on(GameEvents.SHOW_MESSAGE, (data) => this.showMessage(data.message, data.type));
    }

    /**
     * Show a specific screen
     * @param {string} screenId
     */
    showScreen(screenId) {
        // Hide all screens
        this.mainMenu.classList.remove('active');
        this.setupScreen.classList.remove('active');
        this.gameScreen.classList.remove('active');

        // Show requested screen
        switch (screenId) {
            case 'menu':
                this.mainMenu.classList.add('active');
                break;
            case 'setup':
                this.setupScreen.classList.add('active');
                break;
            case 'game':
                this.gameScreen.classList.add('active');
                break;
        }
    }

    /**
     * Handle game start
     */
    onGameStart() {
        this.showScreen('game');
        this.updatePlayerInfos();
    }

    /**
     * Update all player info displays
     */
    updatePlayerInfos() {
        this.playerInfoElements.forEach((el, index) => {
            const playerIndex = parseInt(el.dataset.player);
            const player = gameState.players[playerIndex];

            if (player) {
                const nameEl = el.querySelector('.player-name');
                const avatarEl = el.querySelector('.player-avatar');

                if (nameEl) {
                    nameEl.textContent = player.name;
                    if (player.isAI) {
                        nameEl.textContent += ' (AI)';
                    }
                }

                el.classList.remove('active');
            }
        });
    }

    /**
     * Handle turn start
     * @param {Object} player
     */
    onTurnStart(player) {
        // Update active player highlight
        this.playerInfoElements.forEach(el => {
            const playerIndex = parseInt(el.dataset.player);
            if (playerIndex === player.index) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Show turn announcement
        this.showAnnouncement(`${player.name}'s Turn`, player.color);
    }

    /**
     * Show turn announcement
     * @param {string} text
     * @param {string} color
     */
    showAnnouncement(text, color) {
        this.announcementText.textContent = text;
        this.announcementText.style.color = PLAYER_COLORS[color]?.primary || '#fff';

        this.announcement.classList.add('active');

        setTimeout(() => {
            this.announcement.classList.remove('active');
        }, ANIMATION_DURATIONS.MESSAGE_DISPLAY);
    }

    /**
     * Show a message to the user
     * @param {string} message
     * @param {string} type - 'info', 'success', 'warning', 'error'
     */
    showMessage(message, type = 'info') {
        this.showAnnouncement(message, null);
    }

    /**
     * Show victory screen
     * @param {Object} player
     */
    showVictory(player) {
        const winnerName = document.getElementById('winner-name');
        const winnerUfo = document.getElementById('winner-ufo');

        winnerName.textContent = `${player.name} Wins!`;
        winnerName.style.color = PLAYER_COLORS[player.color]?.primary || '#fff';

        // Create winner UFO
        winnerUfo.innerHTML = '';
        const ufo = this.createUfoElement(player.color);
        ufo.classList.add('finished');
        winnerUfo.appendChild(ufo);

        this.victoryOverlay.classList.add('active');
    }

    /**
     * Hide victory screen
     */
    hideVictory() {
        this.victoryOverlay.classList.remove('active');
    }

    /**
     * Create a UFO element for display
     * @param {string} color
     * @returns {HTMLElement}
     */
    createUfoElement(color) {
        const ufo = document.createElement('div');
        ufo.className = `ufo-token ${color.toLowerCase()}`;
        ufo.style.width = '100%';
        ufo.style.height = '100%';

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

        return ufo;
    }

    /**
     * Generate player input rows for setup screen
     * @param {string} mode - 'local' or 'ai'
     */
    generatePlayerInputs(mode) {
        const container = document.getElementById('player-inputs');
        container.innerHTML = '';

        const colors = ['red', 'green', 'yellow', 'blue'];
        const colorNames = ['Red', 'Green', 'Yellow', 'Blue'];

        for (let i = 0; i < 4; i++) {
            const row = document.createElement('div');
            row.className = 'player-input-row';
            row.dataset.playerIndex = i;

            // Color dot
            const colorDot = document.createElement('div');
            colorDot.className = `player-color-dot ${colors[i]}`;

            // Name input
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = `Player ${i + 1} (${colorNames[i]})`;
            nameInput.dataset.playerIndex = i;
            nameInput.className = 'player-name-input';

            row.appendChild(colorDot);
            row.appendChild(nameInput);

            // Type toggle for AI mode
            if (mode === 'ai') {
                const typeToggle = document.createElement('div');
                typeToggle.className = 'player-type-toggle';

                const humanBtn = document.createElement('button');
                humanBtn.className = 'type-btn' + (i === 0 ? ' active' : '');
                humanBtn.textContent = 'Human';
                humanBtn.dataset.type = 'human';

                const aiBtn = document.createElement('button');
                aiBtn.className = 'type-btn' + (i !== 0 ? ' active' : '');
                aiBtn.textContent = 'AI';
                aiBtn.dataset.type = 'ai';

                typeToggle.appendChild(humanBtn);
                typeToggle.appendChild(aiBtn);
                row.appendChild(typeToggle);

                // Toggle handlers
                humanBtn.addEventListener('click', () => {
                    humanBtn.classList.add('active');
                    aiBtn.classList.remove('active');
                });

                aiBtn.addEventListener('click', () => {
                    aiBtn.classList.add('active');
                    humanBtn.classList.remove('active');
                });
            }

            container.appendChild(row);
        }

        // Show/hide AI settings
        const aiSettings = document.getElementById('ai-settings');
        aiSettings.style.display = mode === 'ai' ? 'block' : 'none';
    }

    /**
     * Get player configuration from setup form
     * @returns {Object} Player configuration
     */
    getPlayerConfig() {
        const rows = document.querySelectorAll('.player-input-row');
        const players = [];

        rows.forEach((row, index) => {
            const nameInput = row.querySelector('.player-name-input');
            const aiBtn = row.querySelector('.type-btn[data-type="ai"]');

            players.push({
                name: nameInput.value || `Player ${index + 1}`,
                isAI: aiBtn ? aiBtn.classList.contains('active') : false
            });
        });

        // Get AI difficulty
        const activeAiBtn = document.querySelector('.diff-btn.active');
        const aiDifficulty = activeAiBtn?.dataset.difficulty?.toUpperCase() || 'MEDIUM';

        return {
            players,
            aiDifficulty
        };
    }

    /**
     * Setup difficulty button handlers
     */
    setupDifficultyButtons() {
        const diffButtons = document.querySelectorAll('.diff-btn');
        diffButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                diffButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
}
