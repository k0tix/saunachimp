// Löyly Hero - Guitar Hero Style Game
class LoylyHeroGame {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.notesHit = 0;
        this.totalNotes = 0;
        this.isGameActive = false;
        this.gameStartTime = 0;
        this.notes = [];
        this.nextNoteId = 0;
        
        // DOM elements
        this.scoreEl = document.getElementById('score');
        this.streakEl = document.getElementById('streak');
        this.heatEl = document.getElementById('heat');
        this.notesContainer = document.getElementById('notes-container');
        this.feedbackEl = document.getElementById('feedback');
        this.steamEffects = document.getElementById('steam-effects');
        this.introOverlay = document.getElementById('intro-overlay');
        this.endOverlay = document.getElementById('end-overlay');
        
        // Game configuration
        this.trackSpeed = 3000; // 3 seconds for a note to fall
        this.hitZonePosition = 85; // Percentage from top where hit zone is
        this.hitTolerance = 8; // Percentage tolerance for hits
        
        this.config = null;
        this.setupEventListeners();
    }

    init(config) {
        this.config = config;
        this.startIntroSequence();
    }

    setupEventListeners() {
        // Listen for scene events from parent
        window.addEventListener('message', (event) => {
            if (event.data.type === 'SCENE_CONFIG') {
                this.init(event.data.config);
            } else if (event.data.type === 'SCENE_API_EVENT') {
                this.handleSceneEvent(event.data.event);
            }
        });
    }

    handleSceneEvent(eventType) {
        console.log('Received event:', eventType);
        
        switch(eventType) {
            case 'START_SCENE':
                // Could reset game or do something special
                break;
            case 'THROW_LOYLY':
                // This could trigger a special note or effect
                break;
            case 'SCENE_WIN':
                this.endGame(true);
                break;
            case 'SCENE_LOSE':
                this.endGame(false);
                break;
        }
    }

    startIntroSequence() {
        let countdown = 3;
        const countdownEl = document.getElementById('countdown');
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownEl.textContent = countdown;
            } else {
                clearInterval(countdownInterval);
                this.introOverlay.style.opacity = '0';
                setTimeout(() => {
                    this.introOverlay.style.display = 'none';
                    this.startGame();
                }, 500);
            }
        }, 1000);
    }

    startGame() {
        this.isGameActive = true;
        this.gameStartTime = Date.now();
        this.score = 0;
        this.streak = 0;
        this.notesHit = 0;
        this.totalNotes = 0;
        
        // Generate note pattern (simulated, predetermined)
        this.generateNotePattern();
        
        // Start game loop
        this.gameLoop();
    }

    generateNotePattern() {
        // Create an epic pattern of notes with varying timings
        const pattern = [
            { time: 2000, type: 'normal' },
            { time: 3500, type: 'normal' },
            { time: 5000, type: 'fire' },
            { time: 6500, type: 'normal' },
            { time: 7500, type: 'normal' },
            { time: 9000, type: 'fire' },
            { time: 10500, type: 'normal' },
            { time: 12000, type: 'fire' },
            { time: 13000, type: 'normal' },
            { time: 14000, type: 'normal' },
            { time: 15500, type: 'fire' },
            { time: 17000, type: 'normal' },
            { time: 18500, type: 'mega' },
            { time: 20000, type: 'normal' },
            { time: 21000, type: 'fire' },
            { time: 22500, type: 'mega' },
        ];

        this.notePattern = pattern;
        this.totalNotes = pattern.length;
    }

    gameLoop() {
        if (!this.isGameActive) return;

        const elapsed = Date.now() - this.gameStartTime;

        // Spawn notes based on pattern
        this.notePattern = this.notePattern.filter(noteData => {
            if (elapsed >= noteData.time) {
                this.spawnNote(noteData.type);
                return false; // Remove from pattern
            }
            return true;
        });

        // Update existing notes
        this.updateNotes();

        // Check if game should end (all notes played and fallen)
        if (this.notePattern.length === 0 && this.notes.length === 0) {
            setTimeout(() => this.endGame(true), 1000);
            return;
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    spawnNote(type = 'normal') {
        const noteId = this.nextNoteId++;
        
        // Determine if this note will be a miss (20% chance for normal, 10% for fire, 5% for mega)
        let missChance = 0.20;
        if (type === 'fire') missChance = 0.10;
        if (type === 'mega') missChance = 0.05;
        
        const willMiss = Math.random() < missChance;
        
        console.log(`Note ${noteId} spawned: type=${type}, willMiss=${willMiss}`);
        
        const note = {
            id: noteId,
            type: type,
            spawnTime: Date.now(),
            element: this.createNoteElement(type),
            hit: false,
            missed: false,
            willMiss: willMiss,
            autoHitTime: willMiss ? null : Date.now() + this.trackSpeed - 100, // No auto-hit if will miss
        };

        this.notesContainer.appendChild(note.element);
        this.notes.push(note);
    }

    createNoteElement(type) {
        const note = document.createElement('div');
        note.className = `note note-${type}`;
        
        let emoji = '💧'; // Water droplet for normal
        if (type === 'fire') emoji = '🔥';
        if (type === 'mega') emoji = '💎';
        
        note.innerHTML = `
            <div class="note-inner">
                <span class="note-emoji">${emoji}</span>
                <div class="note-glow"></div>
            </div>
        `;
        
        return note;
    }

    updateNotes() {
        const now = Date.now();
        
        this.notes = this.notes.filter(note => {
            const elapsed = now - note.spawnTime;
            const progress = Math.min(elapsed / this.trackSpeed, 1);
            const position = progress * 100;

            // Update position
            note.element.style.top = `${position}%`;

            // Check if note should be hit or missed
            if (!note.hit && !note.missed) {
                // Hit zone is around 85%
                if (note.willMiss && position > 88) {
                    // Note was missed!
                    this.missNote(note);
                    // Keep note temporarily for animation, will be removed on next iteration
                } else if (!note.willMiss && note.autoHitTime && now >= note.autoHitTime) {
                    // Auto-hit for successful notes
                    this.hitNote(note, 'perfect');
                    // Keep note temporarily for animation, will be removed on next iteration
                }
            }

            // Remove if animation is done (500ms after hit/miss)
            if ((note.hit || note.missed) && now - note.actionTime > 500) {
                note.element.remove();
                return false;
            }

            // Remove if past the screen without being processed
            if (progress > 1.1 && !note.hit && !note.missed) {
                note.element.remove();
                return false;
            }

            return true;
        });
    }

    hitNote(note, quality = 'perfect') {
        console.log(`Note ${note.id} HIT! Quality: ${quality}`);
        note.hit = true;
        note.actionTime = Date.now();
        note.element.classList.add('note-hit');

        // Calculate points based on quality and streak
        let basePoints = 100;
        if (note.type === 'fire') basePoints = 200;
        if (note.type === 'mega') basePoints = 500;

        const streakMultiplier = 1 + (this.streak * 0.1);
        const points = Math.floor(basePoints * streakMultiplier);

        this.score += points;
        this.notesHit++;
        this.streak++;
        this.maxStreak = Math.max(this.maxStreak, this.streak);

        // Update UI
        this.updateUI();

        // Show feedback
        this.showFeedback(quality, points);

        // Create steam effect
        this.createSteamEffect();
    }

    missNote(note) {
        console.log(`Note ${note.id} MISSED!`);
        note.missed = true;
        note.actionTime = Date.now();
        note.element.classList.add('note-missed');

        // Reset streak on miss
        this.streak = 0;

        // Update UI
        this.updateUI();

        // Show miss feedback
        this.showMissFeedback();
    }

    showFeedback(quality, points) {
        const messages = {
            perfect: ['PERFECT!', 'AMAZING!', 'LEGENDARY!', 'ON FIRE! 🔥', 'INCREDIBLE!'],
            good: ['GOOD!', 'NICE!', 'GREAT!'],
            okay: ['OK!', 'NOT BAD!']
        };

        const message = messages[quality][Math.floor(Math.random() * messages[quality].length)];
        
        this.feedbackEl.textContent = `${message} +${points}`;
        this.feedbackEl.className = `feedback feedback-${quality} feedback-show`;

        setTimeout(() => {
            this.feedbackEl.classList.remove('feedback-show');
        }, 800);
    }

    showMissFeedback() {
        const messages = ['MISS!', 'OH NO!', 'TOO LATE!', 'OOPS!', 'MISSED! 😅'];
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        this.feedbackEl.textContent = message;
        this.feedbackEl.className = `feedback feedback-miss feedback-show`;

        setTimeout(() => {
            this.feedbackEl.classList.remove('feedback-show');
        }, 800);
    }

    createSteamEffect() {
        const steam = document.createElement('div');
        steam.className = 'steam-particle';
        steam.style.left = `${50 + (Math.random() - 0.5) * 20}%`;
        steam.style.animationDuration = `${1 + Math.random() * 0.5}s`;
        
        this.steamEffects.appendChild(steam);
        
        setTimeout(() => steam.remove(), 1500);
    }

    updateUI() {
        this.scoreEl.textContent = this.score.toLocaleString();
        this.streakEl.textContent = `${this.streak}x`;

        // Update heat indicator based on streak
        let heat = '🔥';
        if (this.streak >= 10) heat = '🔥🔥🔥🔥🔥';
        else if (this.streak >= 7) heat = '🔥🔥🔥🔥';
        else if (this.streak >= 5) heat = '🔥🔥🔥';
        else if (this.streak >= 3) heat = '🔥🔥';
        
        this.heatEl.textContent = heat;
    }

    endGame(isWin) {
        this.isGameActive = false;
        
        // Calculate accuracy
        const accuracy = this.totalNotes > 0 
            ? Math.round((this.notesHit / this.totalNotes) * 100) 
            : 100;

        // Update end screen
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-streak').textContent = `${this.maxStreak}x`;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;

        // Set title and message based on performance
        let title = '🎉 INCREDIBLE! 🎉';
        let message = 'The sauna gods smile upon you!';

        if (accuracy === 100) {
            title = '👑 PERFECT SCORE! 👑';
            message = 'You are a true Löyly Master!';
        } else if (accuracy >= 80) {
            title = '🔥 AMAZING! 🔥';
            message = 'Your löyly technique is outstanding!';
        } else if (accuracy >= 60) {
            title = '💪 WELL DONE! 💪';
            message = 'A solid performance in the sauna!';
        } else {
            title = '😅 NICE TRY! 😅';
            message = 'The sauna spirits appreciate your effort!';
        }

        document.getElementById('end-title').textContent = title;
        document.getElementById('end-message').textContent = message;

        // Show end overlay with delay
        setTimeout(() => {
            this.endOverlay.style.display = 'flex';
            setTimeout(() => {
                this.endOverlay.style.opacity = '1';
            }, 50);
        }, 1000);
    }
}

// Initialize game when page loads
const game = new LoylyHeroGame();

// Auto-init if no config received after 2 seconds (for testing)
setTimeout(() => {
    if (!game.isGameActive && !game.config) {
        console.log('Auto-starting game (no config received)');
        game.init({});
    }
}, 2000);
