class WinnerScene {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.explosionsContainer = document.getElementById('explosions-container');
        this.particles = [];
        this.animationFrameId = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    init(config = {}) {
        // Start confetti
        this.spawnInitialConfetti();
        this.loop();

        // Periodic explosions
        this.explosionInterval = setInterval(() => this.spawnExplosion(), 700);

        // Optional auto-complete
        if (config.duration) {
            setTimeout(() => this.onSceneComplete(), config.duration * 1000);
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    spawnInitialConfetti() {
        const colors = ['#ff7675', '#fd79a8', '#ffeaa7', '#fab1a0', '#74b9ff', '#55efc4'];
        for (let i = 0; i < 250; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 3 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: -1 + Math.random() * 2,
                speedY: 1 + Math.random() * 3,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: -0.1 + Math.random() * 0.2,
            });
        }
    }

    spawnExplosion() {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.8; // Keep mostly above center

        const el = document.createElement('div');
        el.className = 'explosion';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        this.explosionsContainer.appendChild(el);

        setTimeout(() => {
            el.remove();
        }, 800);
    }

    loop() {
        this.animationFrameId = requestAnimationFrame(() => this.loop());
        this.update();
        this.draw();
    }

    update() {
        const gravity = 0.05;
        for (const p of this.particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += gravity;
            p.rotation += p.rotationSpeed;

            if (p.y > this.canvas.height + 10) {
                p.y = -10;
                p.x = Math.random() * this.canvas.width;
                p.speedY = 1 + Math.random() * 3;
            }
            if (p.x < -10) p.x = this.canvas.width + 10;
            if (p.x > this.canvas.width + 10) p.x = -10;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const p of this.particles) {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 2);
            this.ctx.restore();
        }
    }

    onSceneComplete() {
        cancelAnimationFrame(this.animationFrameId);
        clearInterval(this.explosionInterval);

        window.parent.postMessage({
            type: 'SCENE_COMPLETE',
            scene: 'winner'
        }, '*');
    }
}

const scene = new WinnerScene();

window.addEventListener('message', (event) => {
    if (event.data.type === 'SCENE_CONFIG') {
        scene.init(event.data.config || {});
    }
});

// Standalone fallback
if (window === window.parent) {
    scene.init({ duration: null });
}
