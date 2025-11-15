class LoserScene {
    constructor() {
        this.retryButton = document.getElementById('retry-button');
        this.retryButton?.addEventListener('click', () => this.onRetry());

        this.sadRain = document.querySelector('.sad-rain');
    }

    init(config = {}) {
        this.config = config;
        this.createSadWaterfall(260); // 200+ characters
    }

    createSadWaterfall(count) {
        if (!this.sadRain) return;

        const chars = [':(', '🧊', '🥶', '☹️'];

        // Clear any existing drops
        this.sadRain.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const span = document.createElement('span');
            span.className = 'sad-drop';
            span.textContent = chars[Math.floor(Math.random() * chars.length)];

            // Spread horizontally across screen
            const left = Math.random() * 100; // %
            span.style.left = `${left}%`;

            // Random duration and delay so they don't sync
            const duration = 4 + Math.random() * 5; // 4–9s
            const delay = -Math.random() * duration; // negative so stream is already in motion
            span.style.animationDuration = `${duration}s`;
            span.style.animationDelay = `${delay}s`;

            // Slight size variation
            const baseSize = 2.4; // rem
            const jitter = (Math.random() - 0.5) * 1.5; // -0.75 to +0.75
            span.style.fontSize = `${baseSize + jitter}rem`;

            // Random horizontal drift via transform-origin and small rotation
            span.style.transformOrigin = 'center top';

            this.sadRain.appendChild(span);
        }
    }

    onRetry() {
        window.parent.postMessage({
            type: 'SCENE_COMPLETE',
            scene: 'loser',
            action: 'retry'
        }, '*');
    }
}

const scene = new LoserScene();

window.addEventListener('message', (event) => {
    if (event.data.type === 'SCENE_CONFIG') {
        scene.init(event.data.config || {});
    }
});

// Standalone fallback
if (window === window.parent) {
    scene.init({});
}
