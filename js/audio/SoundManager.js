/**
 * SoundManager - Web Audio API sound effects manager
 */
import { SOUNDS } from '../core/Constants.js';
import { eventBus, GameEvents } from '../core/EventBus.js';

export class SoundManager {
    constructor() {
        this.context = null;
        this.sounds = new Map();
        this.enabled = true;
        this.masterVolume = 0.7;
        this.initialized = false;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        eventBus.on(GameEvents.TOGGLE_SOUND, (data) => {
            this.enabled = data.enabled;
        });

        // Game sound events
        eventBus.on(GameEvents.DICE_ROLL_START, () => this.play(SOUNDS.DICE_ROLL));
        eventBus.on(GameEvents.TOKEN_MOVE, () => this.play(SOUNDS.TOKEN_MOVE, { volume: 0.5 }));
        eventBus.on(GameEvents.TOKEN_CAPTURE, () => this.play(SOUNDS.TOKEN_CAPTURE));
        eventBus.on(GameEvents.TOKEN_UNLOCK, () => this.play(SOUNDS.TOKEN_UNLOCK));
        eventBus.on(GameEvents.PLAYER_WIN, () => this.play(SOUNDS.VICTORY));
        eventBus.on(GameEvents.TURN_START, (data) => {
            if (!data.player.isAI) {
                this.play(SOUNDS.TURN_START, { volume: 0.3 });
            }
        });
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    async init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            await this.generateSounds();
            this.initialized = true;
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }

    /**
     * Generate synthetic sound effects
     */
    async generateSounds() {
        // Dice roll sound
        this.sounds.set(SOUNDS.DICE_ROLL, this.createDiceRollSound());

        // Token move sound
        this.sounds.set(SOUNDS.TOKEN_MOVE, this.createTokenMoveSound());

        // Capture sound
        this.sounds.set(SOUNDS.TOKEN_CAPTURE, this.createCaptureSound());

        // Unlock sound
        this.sounds.set(SOUNDS.TOKEN_UNLOCK, this.createUnlockSound());

        // Victory sound
        this.sounds.set(SOUNDS.VICTORY, this.createVictorySound());

        // Turn start sound
        this.sounds.set(SOUNDS.TURN_START, this.createTurnStartSound());
    }

    /**
     * Create dice roll sound
     */
    createDiceRollSound() {
        return (ctx, destination) => {
            const duration = 0.6;

            // Multiple short clicks
            for (let i = 0; i < 8; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'square';
                osc.frequency.value = 200 + Math.random() * 300;

                const startTime = ctx.currentTime + i * 0.07 + Math.random() * 0.02;
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialDecayTo(0.01, startTime + 0.05);

                osc.connect(gain);
                gain.connect(destination);

                osc.start(startTime);
                osc.stop(startTime + 0.05);
            }
        };
    }

    /**
     * Create token move sound
     */
    createTokenMoveSound() {
        return (ctx, destination) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        };
    }

    /**
     * Create capture sound
     */
    createCaptureSound() {
        return (ctx, destination) => {
            // Impact sound
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();

            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(150, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);

            gain1.gain.setValueAtTime(0.4, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            osc1.connect(gain1);
            gain1.connect(destination);

            osc1.start();
            osc1.stop(ctx.currentTime + 0.3);

            // Zap sound
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();

            osc2.type = 'square';
            osc2.frequency.setValueAtTime(800, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

            gain2.gain.setValueAtTime(0.2, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

            osc2.connect(gain2);
            gain2.connect(destination);

            osc2.start();
            osc2.stop(ctx.currentTime + 0.15);
        };
    }

    /**
     * Create unlock sound
     */
    createUnlockSound() {
        return (ctx, destination) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        };
    }

    /**
     * Create victory sound
     */
    createVictorySound() {
        return (ctx, destination) => {
            const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                const startTime = ctx.currentTime + i * 0.15;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

                osc.connect(gain);
                gain.connect(destination);

                osc.start(startTime);
                osc.stop(startTime + 0.4);
            });
        };
    }

    /**
     * Create turn start sound
     */
    createTurnStartSound() {
        return (ctx, destination) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = 440;

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        };
    }

    /**
     * Play a sound
     * @param {string} soundName - Sound name from SOUNDS constant
     * @param {Object} options - {volume, pitch}
     */
    play(soundName, options = {}) {
        if (!this.enabled || !this.context) return;

        // Resume context if suspended
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const soundFn = this.sounds.get(soundName);
        if (!soundFn) return;

        // Create gain node for volume control
        const gainNode = this.context.createGain();
        gainNode.gain.value = (options.volume || 1) * this.masterVolume;
        gainNode.connect(this.context.destination);

        // Play the sound
        try {
            soundFn(this.context, gainNode);
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }

    /**
     * Toggle sound on/off
     * @returns {boolean} New enabled state
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Set master volume
     * @param {number} volume - 0 to 1
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Get enabled state
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }
}

// Polyfill for exponentialDecayTo
if (typeof GainNode !== 'undefined') {
    GainNode.prototype.exponentialDecayTo = function(value, time) {
        this.gain.setTargetAtTime(value, time, 0.015);
    };
}

// Create singleton instance
export const soundManager = new SoundManager();
