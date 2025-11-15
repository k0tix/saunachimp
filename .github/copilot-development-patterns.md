# Development Patterns

## Adding a New Scene

### 1. Create Scene Handler

```typescript
// backend/src/services/scenes/scene2.ts
import { GameEvent, HousekeepingStatus, getHousekeepingSceneStatus, setHousekeepingSceneStatus } from "../housekeeping";

export const handleScene2 = async (status: HousekeepingStatus): Promise<GameEvent[]> => {
  // Initialize scene
  if (getHousekeepingSceneStatus() === 0) {
    setHousekeepingSceneStatus(1);
    return [
      { event_type: 'START_SCENE', run_at: Date.now() }
    ];
  }
  
  // Scene logic
  if (status.info.temp > 90) {
    return [
      { event_type: 'HIGH_TEMP_ALERT', run_at: Date.now() }
    ];
  }
  
  return [];
};
```

### 2. Register in Housekeeping

```typescript
// backend/src/services/housekeeping.ts
import { handleScene2 } from './scenes/scene2';

// In runHousekeeping()
switch (housekeepingState.game.scene_config.id) {
  case 1:
    housekeepingState.game.event_queue.push(...await handleScene1(housekeepingState));
    break;
  case 2:
    housekeepingState.game.event_queue.push(...await handleScene2(housekeepingState));
    break;
}
```

### 3. Create Frontend

```javascript
// simple-frontend/scenes/my-scene/script.js
class MyScene {
  constructor() {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'SCENE_API_EVENT') {
        this.handleEvent(event.data.event);
      }
    });
  }
  
  handleEvent(eventType) {
    switch(eventType) {
      case 'HIGH_TEMP_ALERT':
        this.showWarning();
        break;
    }
  }
}

const scene = new MyScene();
```

## Event Naming

```typescript
// Good - descriptive action names
'LOYLY_THROW'
'SCENE_WIN'
'PLAYER_JOINED'
'TEMP_CRITICAL'

// Bad - too generic
'THROW'
'WIN'
'EVENT'
'UPDATE'
```

## Error Handling

```typescript
// Backend scene handler
export const handleScene1 = async (status: HousekeepingStatus): Promise<GameEvent[]> => {
  try {
    // Scene logic
    return events;
  } catch (error) {
    console.error('Scene1 error:', error);
    return []; // Always return array
  }
};

// Frontend event handler
handleBackendEvent(eventType) {
  try {
    switch(eventType) {
      case 'THROW_LOYLY':
        this.throwLoyly();
        break;
      default:
        console.log('Unknown event:', eventType);
    }
  } catch (error) {
    console.error('Event handler error:', error);
  }
}
```

## Testing Pattern

```typescript
// Test scene handler directly
import { handleScene1 } from './scenes/scene1';

const mockStatus: HousekeepingStatus = {
  enabled: true,
  info: {
    temp: 85,
    humidity: 50,
    presence: true,
    loyly: true
  },
  game: {
    scene_config: { id: 1, status: 0, start_at: null },
    event_queue: []
  }
};

const events = await handleScene1(mockStatus);
console.log('Generated events:', events);
```

## Common Pitfalls

```typescript
// ❌ Don't mutate state directly
housekeepingState.game.event_queue = newEvents; // BAD

// ✅ Use spread operator
housekeepingState.game.event_queue = [...housekeepingState.game.event_queue, ...newEvents];

// ❌ Don't forget to check animation state
throwLoyly() {
  this.ladle.classList.add('throwing'); // BAD - can overlap
}

// ✅ Always check before animating
throwLoyly() {
  if (this.isThrowingAnimating) return;
  this.isThrowingAnimating = true;
  this.ladle.classList.add('throwing');
}

// ❌ Don't use hardcoded delays without cleanup
setInterval(() => this.update(), 1000); // BAD - leaks

// ✅ Store interval reference for cleanup
this.updateInterval = setInterval(() => this.update(), 1000);
// Later: clearInterval(this.updateInterval);
```

