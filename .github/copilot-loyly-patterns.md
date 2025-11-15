# Löyly Game Code Patterns

## Event Listener Setup

```javascript
class LoylyGame {
  constructor() {
    this.isThrowingAnimating = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for backend events via postMessage
    window.addEventListener('message', (event) => {
      if (event.data.type === 'SCENE_API_EVENT') {
        this.handleBackendEvent(event.data.event);
      }
    });
    
    // Manual button controls
    this.throwBtn.addEventListener('mousedown', () => this.startCharging());
    this.throwBtn.addEventListener('mouseup', () => this.throwLoyly());
  }

  handleBackendEvent(eventType) {
    switch(eventType) {
      case 'THROW_LOYLY':
        this.throwLoyly();
        break;
      case 'SCENE_WIN':
        this.gameWon();
        break;
    }
  }
}
```

## Animation Pattern

All animations must check `isThrowingAnimating` to prevent overlaps:

```javascript
throwLoyly() {
  if (this.isThrowingAnimating) return;
  
  this.isThrowingAnimating = true;
  this.throwBtn.disabled = true;
  
  // Animation sequence
  this.ladle.classList.add('throwing');
  
  setTimeout(() => {
    this.createSteam(this.power);
    this.calculateScore(this.power);
    
    setTimeout(() => {
      this.ladle.classList.remove('throwing');
      this.throwBtn.disabled = false;
      this.isThrowingAnimating = false;
    }, 800);
  }, 400);
}
```

## State Management

Game state should be flat and simple:

```javascript
class LoylyGame {
  constructor() {
    // Game state
    this.score = 0;
    this.temperature = 80;
    this.humidity = 10;
    this.power = 0;
    
    // Animation state
    this.isCharging = false;
    this.isThrowingAnimating = false;
  }

  updateUI() {
    this.scoreEl.textContent = this.score;
    this.tempEl.textContent = this.temperature + '°C';
    this.humidityEl.textContent = this.humidity + '%';
  }
}
```

## Testing Events

Manual event trigger for development:

```javascript
// In browser console
window.postMessage({
  type: 'SCENE_API_EVENT',
  event: 'THROW_LOYLY'
}, '*');
```

