/**
 * MenuController - Handles menu interactions and game setup
 */
import { eventBus, GameEvents } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Player } from '../logic/Player.js';

export class MenuController {
    constructor(uiRenderer) {
        this.uiRenderer = uiRenderer;
        this.gameMode = null;

        this.setupEventListeners();
    }

    /**
     * Setup menu button event listeners
     */
    setupEventListeners() {
        // Main menu buttons
        const btnLocal = document.getElementById('btn-local');
        const btnAI = document.getElementById('btn-ai');

        if (btnLocal) {
            btnLocal.addEventListener('click', () => this.selectMode('local'));
        }

        if (btnAI) {
            btnAI.addEventListener('click', () => this.selectMode('ai'));
        }

        // Setup screen buttons
        const btnBack = document.getElementById('btn-back');
        const btnStart = document.getElementById('btn-start');

        if (btnBack) {
            btnBack.addEventListener('click', () => this.goToMainMenu());
        }

        if (btnStart) {
            btnStart.addEventListener('click', () => this.startGame());
        }

        // Victory screen buttons
        const btnPlayAgain = document.getElementById('btn-play-again');
        const btnMainMenu = document.getElementById('btn-main-menu');

        if (btnPlayAgain) {
            btnPlayAgain.addEventListener('click', () => this.restartGame());
        }

        if (btnMainMenu) {
            btnMainMenu.addEventListener('click', () => this.goToMainMenu());
        }

        // Game control buttons
        const btnRestart = document.getElementById('btn-restart');
        const btnMenu = document.getElementById('btn-menu');
        const btnSound = document.getElementById('btn-sound');

        if (btnRestart) {
            btnRestart.addEventListener('click', () => this.confirmRestart());
        }

        if (btnMenu) {
            btnMenu.addEventListener('click', () => this.confirmMainMenu());
        }

        if (btnSound) {
            btnSound.addEventListener('click', () => this.toggleSound());
        }

        // Difficulty buttons
        this.uiRenderer.setupDifficultyButtons();
    }

    /**
     * Select game mode and go to setup
     * @param {string} mode - 'local' or 'ai'
     */
    selectMode(mode) {
        this.gameMode = mode;
        this.uiRenderer.generatePlayerInputs(mode);
        this.uiRenderer.showScreen('setup');
    }

    /**
     * Go back to main menu
     */
    goToMainMenu() {
        this.uiRenderer.hideVictory();
        this.uiRenderer.showScreen('menu');
        gameState.reset();
    }

    /**
     * Start the game with current configuration
     */
    startGame() {
        const config = this.uiRenderer.getPlayerConfig();

        // Create player objects
        const players = config.players.map((p, index) => ({
            name: p.name,
            isAI: this.gameMode === 'ai' ? p.isAI : false,
            aiDifficulty: config.aiDifficulty
        }));

        // Initialize game state
        gameState.initGame({
            mode: this.gameMode,
            players: players,
            aiDifficulty: config.aiDifficulty
        });
    }

    /**
     * Restart current game
     */
    restartGame() {
        this.uiRenderer.hideVictory();

        // Reinitialize with same config
        const snapshot = gameState.getSnapshot();
        const players = snapshot.players.map(p => ({
            name: p.name,
            isAI: p.isAI,
            aiDifficulty: p.aiDifficulty
        }));

        gameState.initGame({
            mode: snapshot.gameMode,
            players: players,
            aiDifficulty: snapshot.aiDifficulty
        });
    }

    /**
     * Confirm restart dialog
     */
    confirmRestart() {
        if (confirm('Are you sure you want to restart the game?')) {
            this.restartGame();
        }
    }

    /**
     * Confirm return to main menu
     */
    confirmMainMenu() {
        if (confirm('Are you sure you want to return to the main menu? Current game will be lost.')) {
            this.goToMainMenu();
        }
    }

    /**
     * Toggle sound
     */
    toggleSound() {
        const enabled = gameState.toggleSound();
        const btnSound = document.getElementById('btn-sound');

        if (btnSound) {
            btnSound.innerHTML = enabled ? '&#128266;' : '&#128263;';
            btnSound.title = enabled ? 'Sound On' : 'Sound Off';
        }
    }
}
