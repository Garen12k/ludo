/**
 * Space Ludo - Main Application Entry Point
 */

// Core imports
import { eventBus, GameEvents } from './core/EventBus.js';
import { gameState } from './core/GameState.js';

// Logic imports
import { turnManager } from './logic/TurnManager.js';
import { dice } from './logic/Dice.js';

// Rendering imports
import { BoardRenderer } from './rendering/BoardRenderer.js';
import { TokenRenderer } from './rendering/TokenRenderer.js';
import { DiceRenderer } from './rendering/DiceRenderer.js';
import { UIRenderer } from './rendering/UIRenderer.js';

// AI imports
import { aiController } from './ai/AIController.js';

// Effects imports
import { ParticleSystem } from './effects/ParticleSystem.js';
import { ScreenEffects } from './effects/ScreenEffects.js';
import { StarField } from './effects/StarField.js';

// Audio imports
import { soundManager } from './audio/SoundManager.js';

// UI imports
import { MenuController } from './ui/MenuController.js';
import { GameUI } from './ui/GameUI.js';

/**
 * Main Game Application
 */
class SpaceLudoApp {
    constructor() {
        this.boardRenderer = null;
        this.tokenRenderer = null;
        this.diceRenderer = null;
        this.uiRenderer = null;
        this.menuController = null;
        this.gameUI = null;
        this.particleSystem = null;
        this.screenEffects = null;
        this.starField = null;

        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) return;

        console.log('Initializing Space Ludo...');

        // Wait for DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize renderers
        this.initRenderers();

        // Initialize effects
        this.initEffects();

        // Initialize UI
        this.initUI();

        // Connect AI controller to turn manager
        turnManager.setAIController(aiController);

        // Setup global event handlers
        this.setupGlobalEvents();

        // Initialize audio on first interaction
        this.setupAudioInit();

        this.initialized = true;
        console.log('Space Ludo initialized!');
    }

    /**
     * Initialize rendering components
     */
    initRenderers() {
        // Board renderer
        this.boardRenderer = new BoardRenderer('ludo-board');
        this.boardRenderer.render();

        // Token renderer
        this.tokenRenderer = new TokenRenderer(this.boardRenderer);

        // Dice renderer
        this.diceRenderer = new DiceRenderer();

        // UI renderer
        this.uiRenderer = new UIRenderer();
    }

    /**
     * Initialize effects
     */
    initEffects() {
        // Particle system
        this.particleSystem = new ParticleSystem('particle-canvas');

        // Screen effects
        this.screenEffects = new ScreenEffects();

        // Star field (using CSS, optional canvas enhancement)
        this.starField = new StarField();
    }

    /**
     * Initialize UI controllers
     */
    initUI() {
        // Menu controller
        this.menuController = new MenuController(this.uiRenderer);

        // In-game UI
        this.gameUI = new GameUI();
    }

    /**
     * Setup global event handlers
     */
    setupGlobalEvents() {
        // Game start - set AI difficulty
        eventBus.on(GameEvents.GAME_START, (data) => {
            aiController.setDifficulty(gameState.aiDifficulty);
        });

        // Victory - show confetti
        eventBus.on(GameEvents.PLAYER_WIN, (data) => {
            // Victory effects are handled by particle system via events
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.particleSystem) {
                this.particleSystem.resize();
            }
        });
    }

    /**
     * Setup audio initialization on first user interaction
     */
    setupAudioInit() {
        const initAudio = async () => {
            await soundManager.init();
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };

        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }
}

// Create and initialize the application
const app = new SpaceLudoApp();
app.init().catch(error => {
    console.error('Failed to initialize Space Ludo:', error);
});

// Export for debugging
window.SpaceLudo = {
    app,
    gameState,
    eventBus,
    GameEvents,
    turnManager,
    dice,
    aiController
};
