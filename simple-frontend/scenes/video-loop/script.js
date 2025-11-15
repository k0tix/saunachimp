// Video Loop Scene Controller
class VideoLoopScene {
    constructor() {
        this.video = document.getElementById('background-video');
        this.mainText = document.getElementById('main-text');
        this.subText = document.getElementById('sub-text');
        this.config = null;
    }

    init(config) {
        this.config = config;
        
        // Set video source
        if (config.videoUrl) {
            this.video.src = config.videoUrl;
            this.video.load();
        } else {
            // Fallback: show gradient background
            document.querySelector('.scene-wrapper').style.background = 
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        
        // Set text content
        this.mainText.textContent = config.text || 'Welcome to the Sauna!';
        this.subText.textContent = config.subText || '';
        
        // Auto-advance if duration is set
        if (config.duration) {
            setTimeout(() => {
                this.onSceneComplete();
            }, config.duration * 1000);
        }
    }

    onSceneComplete() {
        // Notify parent that scene is complete
        window.parent.postMessage({
            type: 'SCENE_COMPLETE',
            scene: 'video-loop'
        }, '*');
    }
}

// Listen for configuration from parent
const scene = new VideoLoopScene();

window.addEventListener('message', (event) => {
    if (event.data.type === 'SCENE_CONFIG') {
        scene.init(event.data.config);
    }
});

// Initialize with default config if running standalone
if (window === window.parent) {
    scene.init({
        videoUrl: '',
        text: 'Sauna Experience',
        subText: 'Relax and enjoy the heat',
        duration: null
    });
}
