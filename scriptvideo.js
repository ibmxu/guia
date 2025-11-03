
// ===========================================================================================
// === CONTROLE DE PÁGINA: PAUSAR E REINICIALIZAR VÍDEOS ===
// ===========================================================================================

// Pausar todos os vídeos da página atual
function pauseAllVideosOnCurrentPage() {
    const currentPageElement = document.querySelectorAll('.page')[window.currentPage];
    if (!currentPageElement) return;

    // Se existir função global de pausa, usa ela
    if (window.pauseAllVideoPlayers) {
        window.pauseAllVideoPlayers();
    }

    // Pausar vídeos do YouTube via postMessage
    const videoContainers = currentPageElement.querySelectorAll('.video-component');
    videoContainers.forEach(container => {
        const iframe = container.querySelector('.youtube-player');
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage(
                    '{"event":"command","func":"pauseVideo","args":""}', '*'
                );
            } catch (e) {
                console.log('Erro ao pausar vídeo via postMessage:', e);
            }
        }
    });

    // Pausar vídeos HTML5 nativos
    const html5Videos = currentPageElement.querySelectorAll('video');
    html5Videos.forEach(video => {
        if (!video.paused) video.pause();
    });
}

// Recarregar players de vídeo se a página atual contiver vídeos
function reinitializeVideoPlayersIfNeeded() {
    const currentPageElement = document.querySelectorAll('.page')[window.currentPage];
    if (!currentPageElement) return;

    const videoContainers = currentPageElement.querySelectorAll('.video-component');
    if (videoContainers.length > 0 && (!window.videoPlayers || window.videoPlayers.length === 0)) {
        if (window.initializeVideoPlayers) {
            window.initializeVideoPlayers();
        }
    }
}

// ===========================================================================================
// === PLAYER DE VÍDEO INTERATIVO (YouTube + HTML5) ===
// ===========================================================================================

class InteractiveVideoPlayer {
    constructor(container) {
        this.container = container;
        this.player = null;
        this.questionShown = false;
        this.videoEnded = false;
        this.isDestroyed = false;
        this.timeCheckInterval = null;
        this.retryCount = 0;
        this.maxRetries = 3;

        if (!container || !container.dataset) {
            console.error('Container inválido para player de vídeo');
            return;
        }

        // Configurações
        this.config = {
            videoId: container.dataset.videoId || '',
            questionTime: parseInt(container.dataset.questionTime) || 30,
            question: container.dataset.question || 'Pergunta não definida',
            options: this.parseOptions(container.dataset.options),
            feedback: container.dataset.feedback || 'Feedback não definido'
        };

        if (!this.config.videoId) {
            console.error('Video ID não encontrado');
            this.showError('ID do vídeo não encontrado');
            return;
        }

        this.init();
    }

    parseOptions(optionsData) {
        try {
            if (!optionsData) return ['Opção 1', 'Opção 2'];
            return JSON.parse(optionsData);
        } catch {
            return ['Opção 1', 'Opção 2'];
        }
    }

    init() {
        this.elements = {
            iframe: this.container.querySelector('.youtube-player'),
            overlay: this.container.querySelector('.question-overlay'),
            questionTitle: this.container.querySelector('.question-title'),
            optionsContainer: this.container.querySelector('.options'),
            feedback: this.container.querySelector('.feedback'),
            progressFill: this.container.querySelector('.progress-fill'),
            status: this.container.querySelector('.video-status')
        };

        if (!this.elements.iframe) {
            this.showError('Player não encontrado');
            return;
        }

        const uniqueId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.elements.iframe.id = uniqueId;

        const newSrc = this.buildOptimizedSrc();
        if (this.elements.iframe.src !== newSrc) {
            this.elements.iframe.src = newSrc;
        }

        this.setupQuestion();
        this.waitForYouTubeAPI(() => {
            if (!this.isDestroyed) {
                this.initPlayer(uniqueId);
            }
        });
    }

    buildOptimizedSrc() {
        const params = {
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1
        };
        const paramString = Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        return `https://www.youtube.com/embed/${this.config.videoId}?${paramString}`;
    }

    
}

// ===========================================================================================
// === CONTROLE GLOBAL DOS PLAYERS ===
// ===========================================================================================

let youtubeAPILoaded = false;
let youtubeAPILoading = false;
window.videoPlayers = window.videoPlayers || [];

function loadYouTubeAPI() {
    if (youtubeAPILoaded || youtubeAPILoading) return;

    youtubeAPILoading = true;
    if (window.YT && window.YT.Player) {
        youtubeAPILoaded = true;
        youtubeAPILoading = false;
        return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onload = () => {
        youtubeAPILoaded = true;
        youtubeAPILoading = false;
        console.log('YouTube API carregada');
    };
    document.head.appendChild(tag);
}

// Pausa global
window.pauseAllVideoPlayers = function() {
    if (window.videoPlayers?.length) {
        window.videoPlayers.forEach(player => player?.pauseSafely?.());
    }
};

// Inicializa players
window.initializeVideoPlayers = function() {
    const containers = document.querySelectorAll('.video-component');
    if (!containers.length) return;

    if (window.videoPlayers?.length) {
        window.videoPlayers.forEach(p => p?.destroy?.());
    }
    window.videoPlayers = [];

    containers.forEach(container => {
        const player = new InteractiveVideoPlayer(container);
        if (!player.isDestroyed) window.videoPlayers.push(player);
    });
};

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
    loadYouTubeAPI();
    setTimeout(() => window.initializeVideoPlayers(), 2000);
});

// Callback da API YouTube
window.onYouTubeIframeAPIReady = function() {
    youtubeAPILoaded = true;
    youtubeAPILoading = false;
    setTimeout(() => {
        if (document.querySelectorAll('.video-component').length) {
            window.initializeVideoPlayers();
        }
    }, 500);
};
