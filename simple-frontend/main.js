// Main controller for loading scenes from server
class SaunaController {
    constructor() {
        this.container = document.getElementById('scene-container');
        this.loading = document.getElementById('loading');
        this.currentScene = null;
        this.serverUrl = 'http://localhost:3000'; // Update with your server URL
    }

    async init() {
        // Poll server for scene updates
        this.pollScene();
        setInterval(() => this.pollScene(), 2000); // Poll every 2 seconds
    }

    async pollScene() {
        try {
            const response = await fetch(`${this.serverUrl}/api/scene`);
            const data = await response.json();
            
            if (data.scene !== this.currentScene) {
                // Map numeric scene ids from backend to scene folder names
                const sceneName = this.getSceneName(data.scene);
                this.loadScene(sceneName, data.config);
                this.currentScene = data.scene;
            }
        } catch (error) {
            console.error('Failed to fetch scene:', error);
            // Fallback to demo mode
            this.loadDemoScene();
        }
    }

    /**
     * Maps backend scene identifiers to folder names.
     * Supports both numeric ids and existing string names for backward compatibility.
     * 1 -> loyly-game
     * 2 -> habbo-sauna
     * 3 -> video-loop
     */
    getSceneName(sceneIdOrName) {
        const mapping = {
            1: 'loyly-game',
            2: 'habbo-sauna',
            3: 'video-loop'
        };

        // If it's a number (or numeric string), use the mapping
        if (typeof sceneIdOrName === 'number') {
            return mapping[sceneIdOrName] || 'video-loop';
        }

        const numeric = Number(sceneIdOrName);
        if (!Number.isNaN(numeric) && mapping[numeric]) {
            return mapping[numeric];
        }

        // Otherwise assume it's already a valid scene folder name
        return sceneIdOrName;
    }

    loadScene(sceneName, config) {
        this.loading.style.display = 'none';
        
        // Create iframe for the scene
        const iframe = document.createElement('iframe');
        iframe.src = `scenes/${sceneName}/index.html`;
        
        // Clear container and load new scene
        this.container.innerHTML = '';
        this.container.appendChild(iframe);
        
        // Send config to iframe when loaded
        iframe.onload = () => {
            iframe.contentWindow.postMessage({
                type: 'SCENE_CONFIG',
                config: config
            }, '*');
        };
    }

    loadDemoScene() {
        // Load a demo scene for development
        if (!this.currentScene) {
            this.loadScene('video-loop', {
                videoUrl: 'https://example.com/sauna-video.mp4',
                text: 'Welcome to the Sauna!',
                duration: 30
            });
            this.currentScene = 'demo';
        }
    }
}

// Initialize when DOM is ready
const controller = new SaunaController();
controller.init();
