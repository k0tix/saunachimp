// Game State
let gameState = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    totalNotes: 0,
    isPlaying: false,
    notes: [],
    gameTime: 0,
    gameDuration: 60000, // 60 seconds
};

// Game Configuration
const config = {
    noteSpeed: 3, // pixels per frame
    targetZoneY: window.innerHeight - 280, // Position of target zone
    perfectWindow: 30, // pixels
    goodWindow: 60,
    okWindow: 90,
    spawnInterval: 1000, // milliseconds
    noteStartY: -100,
};

// Initialize
let notesContainer, hitButton, countdown;
let lastSpawnTime = 0;
let animationFrame;
let gameStartTime;

document.addEventListener('DOMContentLoaded', () => {
    notesContainer = document.getElementById('notes-container');
    hitButton = document.getElementById('hitButton');
    countdown = document.getElementById('countdown');

    // Button click handler
    hitButton.addEventListener('click', handleHit);

    // Keyboard handler
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!gameState.isPlaying) {
                startGame();
            } else {
                handleHit();
            }
        }
    });

    // Restart button
    document.getElementById('restartBtn').addEventListener('click', () => {
        document.getElementById('gameOver').classList.remove('show');
        startGame();
    });

    // Exit button
    document.getElementById('exitBtn').addEventListener('click', () => {
        window.parent.postMessage({
            type: 'CHANGE_SCENE',
            scene: 0
        }, '*');
    });

    // Start game with countdown
    showCountdown();
});

function showCountdown() {
    countdown.style.display = 'block';
    let count = 3;
    countdown.textContent = count;

    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdown.textContent = count;
        } else {
            countdown.textContent = 'THROW!';
            setTimeout(() => {
                countdown.style.display = 'none';
                startGame();
            }, 500);
            clearInterval(countInterval);
        }
    }, 1000);
}

function startGame() {
    // Reset state
    gameState = {
        score: 0,
        combo: 0,
        maxCombo: 0,
        hits: 0,
        totalNotes: 0,
        isPlaying: true,
        notes: [],
        gameTime: 0,
        gameDuration: 60000,
    };

    // Clear existing notes
    notesContainer.innerHTML = '';
    
    // Update UI
    updateUI();
    
    // Start game loop
    gameStartTime = Date.now();
    lastSpawnTime = gameStartTime;
    gameLoop();
}

function spawnNote() {
    const note = {
        id: Date.now() + Math.random(),
        y: config.noteStartY,
        element: createNoteElement(),
        spawned: Date.now(),
    };

    gameState.notes.push(note);
    gameState.totalNotes++;
    notesContainer.appendChild(note.element);
}

function createNoteElement() {
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = '💧';
    note.style.top = config.noteStartY + 'px';
    return note;
}

function updateNotes(deltaTime) {
    const currentTime = Date.now();
    
    // Spawn new notes
    if (currentTime - lastSpawnTime > config.spawnInterval) {
        //spawnNote();
        lastSpawnTime = currentTime;
    }

    // Update existing notes
    gameState.notes.forEach((note, index) => {
        note.y += config.noteSpeed;
        note.element.style.top = note.y + 'px';

        // Remove if past bottom
        if (note.y > window.innerHeight) {
            removeNote(index);
            missNote();
        }
    });
}

function handleHit() {
    if (!gameState.isPlaying) return;

    // Flash button effect
    hitButton.style.transform = 'scale(0.95)';
    setTimeout(() => {
        hitButton.style.transform = 'scale(1)';
    }, 100);

    // Find closest note in target zone
    let closestNote = null;
    let closestDistance = Infinity;

    gameState.notes.forEach((note, index) => {
        const distance = Math.abs(note.y - config.targetZoneY);
        if (distance < closestDistance && distance < config.okWindow) {
            closestDistance = distance;
            closestNote = { note, index, distance };
        }
    });

    if (closestNote) {
        hitNote(closestNote.index, closestNote.distance);
    } else {
        // Missed - no note in range
        gameState.combo = 0;
        showFeedback('MISS', 'miss');
    }
}

function hitNote(index, distance) {
    const note = gameState.notes[index];
    
    // Determine hit quality
    let feedback, points, className;
    
    if (distance < config.perfectWindow) {
        feedback = 'PERFECT!';
        points = 100;
        className = 'perfect';
    } else if (distance < config.goodWindow) {
        feedback = 'GOOD!';
        points = 75;
        className = 'good';
    } else {
        feedback = 'OK';
        points = 50;
        className = 'ok';
    }

    // Update game state
    gameState.combo++;
    gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
    gameState.hits++;
    
    // Add combo bonus
    const comboMultiplier = 1 + (gameState.combo * 0.1);
    points = Math.floor(points * comboMultiplier);
    gameState.score += points;

    // Visual feedback
    showFeedback(feedback, className);
    createSteamEffect(note.element);
    
    // Remove note
    removeNote(index);
    
    // Update UI
    updateUI();
}

function missNote() {
    gameState.combo = 0;
    showFeedback('MISS', 'miss');
    updateUI();
}

function removeNote(index) {
    const note = gameState.notes[index];
    if (note && note.element.parentNode) {
        note.element.remove();
    }
    gameState.notes.splice(index, 1);
}

function showFeedback(text, className) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${className}`;
    feedback.textContent = text;
    document.querySelector('.game-area').appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 800);
}

function createSteamEffect(noteElement) {
    const rect = noteElement.getBoundingClientRect();
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'steam-particle';
        particle.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 50) + 'px';
        particle.style.top = rect.top + 'px';
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 2000);
    }
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('combo').textContent = gameState.combo;
    
    const accuracy = gameState.totalNotes > 0 
        ? Math.round((gameState.hits / gameState.totalNotes) * 100) 
        : 100;
    document.getElementById('accuracy').textContent = accuracy + '%';
}

function gameLoop() {
    if (!gameState.isPlaying) return;

    const currentTime = Date.now();
    gameState.gameTime = currentTime - gameStartTime;

    // Check if game is over
    if (gameState.gameTime >= gameState.gameDuration) {
        endGame();
        return;
    }

    updateNotes();

    animationFrame = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameState.isPlaying = false;
    cancelAnimationFrame(animationFrame);

    // Clear remaining notes
    gameState.notes.forEach(note => {
        if (note.element.parentNode) {
            note.element.remove();
        }
    });
    gameState.notes = [];

    // Show game over screen
    const accuracy = gameState.totalNotes > 0 
        ? Math.round((gameState.hits / gameState.totalNotes) * 100) 
        : 0;
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalAccuracy').textContent = accuracy + '%';
    document.getElementById('gameOver').classList.add('show');
}

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState.isPlaying) {
        // Pause logic could go here
    }
});

