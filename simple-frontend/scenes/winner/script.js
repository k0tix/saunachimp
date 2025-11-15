class FireworksWinnerScene {
    constructor() {
        this.canvas = document.getElementById('fireworks-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.fireworks = [];
        this.particles = [];
        this.gravity = 0.05;
        this.friction = 0.98;
        this.lastLaunchTime = Date.now();
        this.AUTO_LAUNCH_DELAY = 100;

        this.resizeCanvas = this.resizeCanvas.bind(this);
        window.addEventListener('resize', this.resizeCanvas);
        this.resizeCanvas();

        this.canvas.addEventListener('click', (e) => this.launchAtClick(e));
    }

    init(config = {}) {
        this.config = config;
        this.animate();

        if (config.duration) {
            setTimeout(() => this.onSceneComplete(), config.duration * 1000);
        }
    }

    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    randomColor() {
        return `hsl(${this.randomRange(0, 360)}, 100%, 70%)`;
    }

    createParticle(x, y, color, velocity) {
        return {
            x,
            y,
            vx: velocity ? velocity.x : this.randomRange(-2, 2),
            vy: velocity ? velocity.y : this.randomRange(-2, 2),
            color,
            radius: this.randomRange(2, 5),
            alpha: 1,
            decay: this.randomRange(0.015, 0.03),
            lifespan: this.randomRange(40, 90)
        };
    }

    createFirework(startX, startY, targetX, targetY) {
        const color = this.randomColor();
        const distanceToTarget = Math.hypot(targetX - startX, targetY - startY);
        const angle = Math.atan2(targetY - startY, targetX - startX);

        return {
            x: startX,
            y: startY,
            startX,
            startY,
            targetX,
            targetY,
            color,
            distanceToTarget,
            distanceTraveled: 0,
            angle,
            speed: 4,
            isExploded: false,
            radius: 2
        };
    }

    updateFirework(firework, index) {
        if (firework.isExploded) return false;

        const vx = Math.cos(firework.angle) * firework.speed;
        const vy = Math.sin(firework.angle) * firework.speed;

        firework.distanceTraveled = Math.hypot(
            firework.x + vx - firework.startX,
            firework.y + vy - firework.startY
        );

        if (firework.distanceTraveled >= firework.distanceToTarget || firework.y < firework.targetY) {
            this.explodeFirework(firework);
            this.fireworks.splice(index, 1);
            return false;
        } else {
            firework.x += vx;
            firework.y += vy;

            if (Math.random() < 0.2) {
                this.particles.push(this.createParticle(firework.x, firework.y, '#ffffff', { x: 0, y: 0.5 }));
            }
            return true;
        }
    }

    drawFirework(firework) {
        this.ctx.save();
        this.ctx.fillStyle = firework.color;
        this.ctx.beginPath();
        this.ctx.arc(firework.x, firework.y, firework.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    explodeFirework(firework) {
        firework.isExploded = true;
        const particleCount = this.randomRange(200, 350);

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = this.randomRange(1, 12);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.particles.push(this.createParticle(firework.x, firework.y, firework.color, { x: vx, y: vy }));
        }
    }

    updateParticle(particle, index) {
        particle.vx *= this.friction;
        particle.vy *= this.friction;
        particle.vy += this.gravity;

        particle.x += particle.vx;
        particle.y += particle.vy;

        particle.alpha -= particle.decay;
        particle.lifespan--;

        if (particle.alpha <= 0 || particle.lifespan <= 0) {
            this.particles.splice(index, 1);
        }
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    animate() {
        this.ctx.fillStyle = 'rgba(13, 13, 26, 0.15)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Fireworks
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const fw = this.fireworks[i];
            if (!fw) continue;
            const alive = this.updateFirework(fw, i);
            if (alive) this.drawFirework(fw);
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (!p) continue;
            this.updateParticle(p, i);
            this.drawParticle(p);
        }

        // Auto-launch
        if ((Date.now() - this.lastLaunchTime) > this.AUTO_LAUNCH_DELAY) {
            const randomX = this.width * this.randomRange(0.2, 0.8);
            const randomY = this.height * this.randomRange(0.2, 0.5);
            this.fireworks.push(this.createFirework(this.width / 2, this.height, randomX, randomY));
            this.lastLaunchTime = Date.now();
        }

        requestAnimationFrame(() => this.animate());
    }

    launchAtClick(e) {
        const startX = this.width / 2;
        const startY = this.height;
        const targetX = e.clientX;
        const targetY = e.clientY;

        this.fireworks.push(this.createFirework(startX, startY, targetX, targetY));
        this.lastLaunchTime = Date.now();
    }

    onSceneComplete() {
        window.parent.postMessage({
            type: 'SCENE_COMPLETE',
            scene: 'fireworks-winner'
        }, '*');
    }
}

const scene = new FireworksWinnerScene();

window.addEventListener('message', (event) => {
    if (event.data.type === 'SCENE_CONFIG') {
        scene.init(event.data.config || {});
    }
});

// Standalone fallback
if (window === window.parent) {
    scene.init({});
}
