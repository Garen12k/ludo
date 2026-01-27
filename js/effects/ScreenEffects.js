/**
 * ScreenEffects - Screen shake, flash, and other effects
 */
import { eventBus, GameEvents } from '../core/EventBus.js';

export class ScreenEffects {
    constructor() {
        this.gameContainer = document.querySelector('.game-container');
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        eventBus.on(GameEvents.EFFECT_SHAKE, (data) => this.shake(data.intensity));
        eventBus.on(GameEvents.EFFECT_FLASH, (data) => this.flash(data.color));
        eventBus.on(GameEvents.TOKEN_CAPTURE, () => this.shake(10));
    }

    /**
     * Screen shake effect
     * @param {number} intensity - Shake intensity (default 10)
     * @param {number} duration - Duration in ms (default 500)
     */
    shake(intensity = 10, duration = 500) {
        if (!this.gameContainer) return;

        const startTime = Date.now();

        const shakeFrame = () => {
            const elapsed = Date.now() - startTime;
            const remaining = 1 - (elapsed / duration);

            if (remaining <= 0) {
                this.gameContainer.style.transform = '';
                return;
            }

            const x = (Math.random() - 0.5) * intensity * remaining * 2;
            const y = (Math.random() - 0.5) * intensity * remaining * 2;

            this.gameContainer.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(shakeFrame);
        };

        shakeFrame();
    }

    /**
     * Screen flash effect
     * @param {string} color - Flash color (default white)
     * @param {number} duration - Duration in ms (default 200)
     */
    flash(color = '#ffffff', duration = 200) {
        const overlay = document.createElement('div');
        overlay.className = 'screen-flash';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: ${color};
            opacity: 0.5;
            pointer-events: none;
            z-index: 9999;
        `;

        document.body.appendChild(overlay);

        // Fade out
        overlay.animate([
            { opacity: 0.5 },
            { opacity: 0 }
        ], {
            duration: duration,
            easing: 'ease-out'
        }).onfinish = () => overlay.remove();
    }

    /**
     * Glow effect around an element
     * @param {HTMLElement} element
     * @param {string} color
     * @param {number} duration
     */
    glow(element, color, duration = 800) {
        if (!element) return;

        element.style.boxShadow = `0 0 0 0 ${color}`;

        element.animate([
            { boxShadow: `0 0 0 0 ${color}` },
            { boxShadow: `0 0 30px 15px ${color}` },
            { boxShadow: `0 0 0 0 transparent` }
        ], {
            duration: duration,
            easing: 'ease-out'
        });
    }

    /**
     * Pulse effect
     * @param {HTMLElement} element
     * @param {number} scale
     * @param {number} duration
     */
    pulse(element, scale = 1.2, duration = 300) {
        if (!element) return;

        element.animate([
            { transform: 'scale(1)' },
            { transform: `scale(${scale})` },
            { transform: 'scale(1)' }
        ], {
            duration: duration,
            easing: 'ease-out'
        });
    }

    /**
     * Ripple effect at click position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} color
     */
    ripple(x, y, color = 'rgba(255, 255, 255, 0.5)') {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: ${color};
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 9998;
        `;

        document.body.appendChild(ripple);

        ripple.animate([
            { width: '0', height: '0', opacity: 1 },
            { width: '100px', height: '100px', opacity: 0 }
        ], {
            duration: 500,
            easing: 'ease-out'
        }).onfinish = () => ripple.remove();
    }
}
