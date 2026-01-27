/**
 * ParticleSystem - Canvas-based particle effects
 */
import { eventBus, GameEvents } from '../core/EventBus.js';
import { PLAYER_COLORS } from '../core/Constants.js';

export class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isRunning = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        eventBus.on(GameEvents.EFFECT_CAPTURE, (data) => this.captureEffect(data));
        eventBus.on(GameEvents.EFFECT_VICTORY, (data) => this.victoryEffect(data));
    }

    /**
     * Resize canvas to window size
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Create particles at a position
     * @param {Object} config - Particle configuration
     */
    emit(config) {
        const {
            x, y, count = 20,
            color = '#fff',
            speed = 5,
            lifetime = 60,
            type = 'explosion',
            size = 4
        } = config;

        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle({
                x, y, color, speed, lifetime, type, size
            }));
        }

        if (!this.isRunning) {
            this.start();
        }
    }

    /**
     * Start animation loop
     */
    start() {
        this.isRunning = true;
        this.animate();
    }

    /**
     * Animation loop
     */
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        this.particles = this.particles.filter(p => p.isAlive());

        for (const particle of this.particles) {
            particle.update();
            particle.draw(this.ctx);
        }

        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.isRunning = false;
        }
    }

    /**
     * Capture explosion effect
     * @param {Object} data - {position, capturedColor}
     */
    captureEffect(data) {
        const { position, capturedColor } = data;

        // Get screen position from board position
        const cell = document.querySelector(
            `[data-row="${position.row}"][data-col="${position.col}"]`
        );

        if (!cell) return;

        const rect = cell.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        const color = PLAYER_COLORS[capturedColor]?.primary || '#ff3366';

        // Explosion burst
        this.emit({
            x, y,
            count: 30,
            color: color,
            speed: 6,
            lifetime: 40,
            type: 'explosion',
            size: 5
        });

        // Ring effect
        this.emit({
            x, y,
            count: 15,
            color: '#fff',
            speed: 8,
            lifetime: 30,
            type: 'ring',
            size: 3
        });
    }

    /**
     * Victory confetti effect
     * @param {Object} data - {winner}
     */
    victoryEffect(data) {
        const { winner } = data;
        const colors = ['#ff3366', '#33ff66', '#ffff33', '#3366ff', '#fff'];

        // Emit confetti from top
        const emitConfetti = () => {
            for (let i = 0; i < 5; i++) {
                this.emit({
                    x: Math.random() * this.canvas.width,
                    y: -10,
                    count: 1,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    speed: 2 + Math.random() * 2,
                    lifetime: 200,
                    type: 'confetti',
                    size: 8
                });
            }
        };

        // Emit confetti over time
        let count = 0;
        const interval = setInterval(() => {
            emitConfetti();
            count++;
            if (count > 100) {
                clearInterval(interval);
            }
        }, 50);
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

/**
 * Individual particle
 */
class Particle {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.color = config.color;
        this.lifetime = config.lifetime;
        this.maxLifetime = config.lifetime;
        this.type = config.type;
        this.size = config.size;

        // Velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = config.speed * (0.5 + Math.random() * 0.5);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Type-specific setup
        if (config.type === 'confetti') {
            this.vy = Math.abs(this.vy) + 1; // Fall down
            this.rotation = Math.random() * 360;
            this.rotationSpeed = (Math.random() - 0.5) * 10;
            this.width = config.size;
            this.height = config.size * 0.5;
        } else if (config.type === 'ring') {
            // Ring particles move outward from center
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }
    }

    /**
     * Update particle state
     */
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;

        if (this.type === 'confetti') {
            this.vy += 0.1; // Gravity
            this.rotation += this.rotationSpeed;
            this.vx *= 0.99; // Air resistance
        } else if (this.type === 'explosion') {
            this.vx *= 0.96;
            this.vy *= 0.96;
        }
    }

    /**
     * Draw particle
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const alpha = this.lifetime / this.maxLifetime;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        if (this.type === 'confetti') {
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        } else if (this.type === 'ring') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Default explosion particle
            const size = this.size * (0.5 + alpha * 0.5);
            ctx.beginPath();
            ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Check if particle is still alive
     * @returns {boolean}
     */
    isAlive() {
        return this.lifetime > 0;
    }
}
