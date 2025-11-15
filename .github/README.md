# SaunaChimp - GitHub Copilot Instructions

Code patterns and conventions for the SaunaChimp interactive sauna platform.

## Quick Reference

- **Event System**: Backend event queue → Frontend postMessage
- **Scene Handlers**: Return `GameEvent[]` from async functions
- **Frontend Pattern**: Listen for `SCENE_API_EVENT` postMessage
- **Event Names**: `SCREAMING_SNAKE_CASE` (e.g., `LOYLY_THROW`)
- **Housekeeping**: Runs every 10s, generates events based on sensor data

## File Organization

```
.github/
├── copilot-instructions.md          # This file - event system overview
├── copilot-loyly-patterns.md        # Frontend game patterns
├── copilot-api-examples.md          # API curl examples
└── copilot-development-patterns.md  # Adding scenes & common patterns
```

## Key Files

- `backend/src/services/housekeeping.ts` - Event loop & queue
- `backend/src/services/scenes/scene1.ts` - Löyly game backend logic
- `simple-frontend/scenes/loyly-game/script.js` - Löyly game frontend
- `backend/src/routes/control.ts` - Scene control & event API

## Common Tasks

### Start a scene
```bash
curl -X POST http://localhost:3000/api/control/scene/start/1
```

### Get events
```bash
curl http://localhost:3000/api/control/scene/events
```

### Test frontend event
```javascript
window.postMessage({type: 'SCENE_API_EVENT', event: 'THROW_LOYLY'}, '*');
```

### Restart backend
```bash
docker compose restart backend
```

## Architecture

```
Sensor Data (10s) 
  → Housekeeping Loop 
  → Scene Handler (scene1.ts)
  → Event Queue (in memory)
  → API Endpoint (/api/control/scene/events)
  → Frontend Poll/PostMessage
  → Animation/Game Logic
```

## See Also

- [copilot-instructions.md](./copilot-instructions.md) - Event system details
- [copilot-loyly-patterns.md](./copilot-loyly-patterns.md) - Game code patterns  
- [copilot-api-examples.md](./copilot-api-examples.md) - API examples
- [copilot-development-patterns.md](./copilot-development-patterns.md) - Development guide

