// Löyly Throwing Game Controller
class LoylyGame {
    constructor() {
        this.score = 0;
        this.temperature = 80;
        this.humidity = 10;
        this.power = 0;
        this.isCharging = false;
        this.isThrowingAnimating = false;
        
        // DOM elements
        this.scoreEl = document.getElementById('score');
        this.tempEl = document.getElementById('temperature');
        this.humidityEl = document.getElementById('humidity');
        this.throwBtn = document.getElementById('throw-button');
        this.powerBar = document.getElementById('power-bar');
        this.ladle = document.getElementById('ladle');
        this.steamContainer = document.getElementById('steam-container');
        this.messageEl = document.getElementById('game-message');
        
        this.config = null;
        this.setupEventListeners();
    }

    init(config) {
        this.config = config;
        
        // Apply server config if provided
        if (config.initialTemp) this.temperature = config.initialTemp;
        if (config.initialHumidity) this.humidity = config.initialHumidity;
        
        this.updateUI();
        
        // Listen for server commands (e.g., forced throw)
        if (config.controlMode === 'server') {
            this.enableServerControl();
        }
    }

    setupEventListeners() {
        // Mouse/Touch events for charging power
        this.throwBtn.addEventListener('mousedown', () => this.startCharging());
        this.throwBtn.addEventListener('mouseup', () => this.throwLoyly());
        this.throwBtn.addEventListener('mouseleave', () => this.stopCharging());
        
        this.throwBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startCharging();
        });
        this.throwBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.throwLoyly();
        });
    }

    startCharging() {
        if (this.isThrowingAnimating) return;
        
        this.isCharging = true;
        this.power = 0;
        this.chargeInterval = setInterval(() => {
            this.power = Math.min(100, this.power + 2);
            this.powerBar.style.width = this.power + '%';
        }, 50);
    }

    stopCharging() {
        this.isCharging = false;
        if (this.chargeInterval) {
            clearInterval(this.chargeInterval);
        }
    }

    throwLoyly() {
        if (!this.isCharging || this.isThrowingAnimating) return;
        
        this.stopCharging();
        this.isThrowingAnimating = true;
        this.throwBtn.disabled = true;
        
        // Animate ladle throw
        this.ladle.classList.add('throwing');
        
        setTimeout(() => {
            this.createSteam(this.power);
            this.calculateScore(this.power);
            
            // Reset
            setTimeout(() => {
                this.ladle.classList.remove('throwing');
                this.throwBtn.disabled = false;
                this.isThrowingAnimating = false;
                this.power = 0;
                this.powerBar.style.width = '0%';
            }, 800);
        }, 400);
    }

    createSteam(power) {
        const steamCount = Math.floor(power / 20) + 1;
        
        for (let i = 0; i < steamCount; i++) {
            setTimeout(() => {
                const steam = document.createElement('div');
                steam.className = 'steam';
                steam.style.left = (50 + (Math.random() - 0.5) * 20) + '%';
                this.steamContainer.appendChild(steam);
                
                setTimeout(() => steam.remove(), 2000);
            }, i * 200);
        }
    }

    calculateScore(power) {
        const points = Math.floor(power / 10);
        this.score += points;
        
        // Update temperature and humidity
        this.temperature += Math.floor(power / 20);
        this.humidity += Math.floor(power / 15);
        
        // Cap values
        this.temperature = Math.min(110, this.temperature);
        this.humidity = Math.min(100, this.humidity);
        
        this.updateUI();
        this.showMessage(`+${points} points!`);
        
        // Check win condition
        if (this.temperature >= 100 || this.humidity >= 80) {
            setTimeout(() => this.gameWon(), 1000);
        }
    }

    updateUI() {
        this.scoreEl.textContent = this.score;
        this.tempEl.textContent = this.temperature + '°C';
        this.humidityEl.textContent = this.humidity + '%';
    }

    showMessage(text) {
        this.messageEl.textContent = text;
        this.messageEl.classList.add('show');
        
        setTimeout(() => {
            this.messageEl.classList.remove('show');
        }, 1500);
    }

    gameWon() {
        this.showMessage('🎉 Perfect Löyly! 🎉');
        
        setTimeout(() => {
            // Notify parent that game is complete
            window.parent.postMessage({
                type: 'SCENE_COMPLETE',
                scene: 'loyly-game',
                score: this.score
            }, '*');
        }, 3000);
    }

    enableServerControl() {
        // Listen for server commands to trigger throw
        window.addEventListener('message', (event) => {
            if (event.data.type === 'THROW_COMMAND') {
                this.power = event.data.power || 50;
                this.powerBar.style.width = this.power + '%';
                
                setTimeout(() => {
                    this.isCharging = true;
                    this.throwLoyly();
                }, 100);
            }
        });
    }
}

// Listen for configuration from parent
const game = new LoylyGame();

window.addEventListener('message', (event) => {
    if (event.data.type === 'SCENE_CONFIG') {
        game.init(event.data.config);
    }
});

// Initialize with default config if running standalone
if (window === window.parent) {
    game.init({
        initialTemp: 80,
        initialHumidity: 10,
        controlMode: 'manual'
    });
}
