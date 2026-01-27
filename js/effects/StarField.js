/**
 * StarField - Animated starfield background (optional canvas enhancement)
 */
export class StarField {
    constructor(canvasId = null) {
        // If no canvas provided, use CSS background (already in space-theme.css)
        if (!canvasId) {
            this.useCSS = true;
            return;
        }

        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.useCSS = true;
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.shootingStars = [];
        this.isRunning = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Resize canvas
     */
    resize() {
        if (this.useCSS) return;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.generateStars();
    }

    /**
     * Generate static stars
     */
    generateStars() {
        this.stars = [];

        const starCount = Math.floor((this.canvas.width * this.canvas.height) / 5000);

        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * Start animation
     */
    start() {
        if (this.useCSS) return;

        this.isRunning = true;
        this.animate();
        this.startShootingStars();
    }

    /**
     * Stop animation
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawStars();
        this.drawShootingStars();

        requestAnimationFrame(() => this.animate());
    }

    /**
     * Draw twinkling stars
     */
    drawStars() {
        const time = Date.now() * 0.001;

        for (const star of this.stars) {
            // Calculate twinkle
            const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinkleOffset);
            const alpha = 0.3 + (star.brightness * 0.5) + (twinkle * 0.2);

            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Start occasional shooting stars
     */
    startShootingStars() {
        if (!this.isRunning) return;

        // Random interval between shooting stars
        const interval = 3000 + Math.random() * 7000;

        setTimeout(() => {
            if (this.isRunning) {
                this.createShootingStar();
                this.startShootingStars();
            }
        }, interval);
    }

    /**
     * Create a shooting star
     */
    createShootingStar() {
        this.shootingStars.push({
            x: Math.random() * this.canvas.width * 0.5,
            y: Math.random() * this.canvas.height * 0.3,
            length: 100 + Math.random() * 100,
            speed: 15 + Math.random() * 10,
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
            life: 1
        });
    }

    /**
     * Draw and update shooting stars
     */
    drawShootingStars() {
        this.shootingStars = this.shootingStars.filter(star => {
            // Update position
            star.x += Math.cos(star.angle) * star.speed;
            star.y += Math.sin(star.angle) * star.speed;
            star.life -= 0.02;

            if (star.life <= 0) return false;

            // Draw
            const gradient = this.ctx.createLinearGradient(
                star.x, star.y,
                star.x - Math.cos(star.angle) * star.length,
                star.y - Math.sin(star.angle) * star.length
            );

            gradient.addColorStop(0, `rgba(255, 255, 255, ${star.life})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);
            this.ctx.lineTo(
                star.x - Math.cos(star.angle) * star.length * star.life,
                star.y - Math.sin(star.angle) * star.length * star.life
            );
            this.ctx.stroke();

            return true;
        });
    }
}
