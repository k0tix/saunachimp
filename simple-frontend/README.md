# SaunaChimp - Interactive Sauna Experience

A simple, modular web application for creating interactive sauna experiences. Built for Junction hackathon with vanilla HTML, CSS, and JavaScript - no complex frameworks needed!

## 🏗️ Project Structure

```
simple-frontend/
├── index.html           # Main entry point
├── main.js             # Scene controller
├── README.md           # This file
└── scenes/             # Individual scene modules
    ├── video-loop/     # Video with text overlay
    │   ├── index.html
    │   ├── style.css
    │   └── script.js
    └── loyly-game/     # Löyly throwing mini-game
        ├── index.html
        ├── style.css
        └── script.js
```

## 🚀 Getting Started

### Running Locally

1. **Simple HTTP Server (Python)**
   ```bash
   python3 -m http.server 8000
   ```
   Then open: http://localhost:8000

2. **Simple HTTP Server (Node.js)**
   ```bash
   npx http-server -p 8000
   ```
   Then open: http://localhost:8000

3. **VS Code Live Server Extension**
   - Install "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

### Testing Individual Scenes

Each scene can be tested independently by opening its `index.html` directly:
- Video Loop: `scenes/video-loop/index.html`
- Löyly Game: `scenes/loyly-game/index.html`

## 🎮 Available Scenes

### 1. Video Loop (`video-loop`)

Displays a looping video with text overlay. Perfect for ambient sauna atmosphere.

**Configuration:**
```javascript
{
  videoUrl: "path/to/video.mp4",  // Video URL
  text: "Welcome!",                // Main heading
  subText: "Relax...",            // Subheading (optional)
  duration: 30                     // Auto-advance after N seconds (optional)
}
```

### 2. Löyly Game (`loyly-game`)

Interactive mini-game where users throw löyly (water) onto the sauna rocks.

**Configuration:**
```javascript
{
  initialTemp: 80,        // Starting temperature
  initialHumidity: 10,    // Starting humidity
  controlMode: "manual"   // "manual" or "server" for remote control
}
```

**Controls:**
- Hold the "THROW LÖYLY!" button to charge power
- Release to throw water on the rocks
- Goal: Reach 100°C or 80% humidity

## 🔌 Server Integration

The main controller (`main.js`) polls your server for scene updates:

### Expected API Response

```javascript
GET /api/scene
{
  "scene": "video-loop",  // or "loyly-game"
  "config": {
    // Scene-specific configuration
  }
}
```

### Server-Controlled Löyly Throws

To control the löyly game from the server:

1. Set `controlMode: "server"` in the config
2. Send messages to trigger throws:

```javascript
iframe.contentWindow.postMessage({
  type: 'THROW_COMMAND',
  power: 75  // 0-100
}, '*');
```

## 🎨 Creating New Scenes

1. Create a new directory under `scenes/`
2. Add `index.html`, `style.css`, and `script.js`
3. Follow the scene template pattern:

```javascript
// script.js template
class MyScene {
    constructor() {
        // Initialize your scene
    }

    init(config) {
        // Setup scene with server config
        this.config = config;
    }

    onSceneComplete() {
        // Notify parent when done
        window.parent.postMessage({
            type: 'SCENE_COMPLETE',
            scene: 'my-scene'
        }, '*');
    }
}

// Listen for config
const scene = new MyScene();
window.addEventListener('message', (event) => {
    if (event.data.type === 'SCENE_CONFIG') {
        scene.init(event.data.config);
    }
});

// Standalone fallback
if (window === window.parent) {
    scene.init({ /* default config */ });
}
```

## 🔧 Configuration

Update the server URL in `main.js`:

```javascript
this.serverUrl = 'http://your-server:3000';
```

## 📝 Tips

- Each scene is isolated in an iframe - no style/script conflicts!
- Scenes communicate with the main app via `postMessage`
- All scenes work standalone for easy testing
- No build process needed - just edit and refresh!

## 🎯 Hackathon Notes

- **Keep it simple**: Vanilla JS only, no frameworks
- **Modular**: Each scene is independent
- **Server-driven**: Scenes change based on server state
- **Interactive**: Support for both passive (video) and active (game) experiences

## 🚧 TODO / Ideas

- [ ] Add more scenes (relaxation timer, temperature display, etc.)
- [ ] Sound effects for löyly game
- [ ] Multiplayer support
- [ ] Leaderboard integration
- [ ] Real video assets
- [ ] Mobile optimization
- [ ] Fullscreen support

---

Built with ❤️ at Junction 2025
