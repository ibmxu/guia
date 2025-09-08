/ ===========================================================================================
// === SCRIPT 2: PLAYER DE VÍDEO INTERATIVO (VERSÃO PARA SUA ESTRUTURA HTML) ===
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
        
        // Verificar se container é válido
        if (!container || !container.dataset) {
            console.error('Container inválido para player de vídeo');
            return;
        }
        
        // Ler configurações com valores padrão
        this.config = {
            videoId: container.dataset.videoId || '',
            questionTime: parseInt(container.dataset.questionTime) || 30,
            question: container.dataset.question || 'Pergunta não definida',
            options: this.parseOptions(container.dataset.options),
            feedback: container.dataset.feedback || 'Feedback não definido'
        };
        
        // Validar videoId
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
        } catch (e) {
            console.error('Erro ao parsear opções:', e);
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
            console.error('Player iframe não encontrado');
            this.showError('Player não encontrado');
            return;
        }
        
        // Gerar ID único para o iframe existente
        const uniqueId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.elements.iframe.id = uniqueId;
        
        // CORREÇÃO: Atualizar o src do iframe existente para incluir parâmetros necessários
        const currentSrc = this.elements.iframe.src;
        const newSrc = this.buildOptimizedSrc();
        
        if (currentSrc !== newSrc) {
            this.elements.iframe.src = newSrc;
        }
        
        this.setupQuestion();
        this.waitForYouTubeAPI(() => {
            if (!this.isDestroyed) {
                this.initPlayer(uniqueId);
            }
        });
    }
    
    // NOVO: Construir URL otimizada para o iframe
    buildOptimizedSrc() {
        const baseParams = {
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1
        };
        
        const paramString = Object.entries(baseParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
            
        return `https://www.youtube.com/embed/${this.config.videoId}?${paramString}`;
    }
    
    showError(message) {
        this.updateStatus(`Erro: ${message}`);
        if (this.elements.iframe) {
            this.elements.iframe.style.display = 'none';
        }
    }
    
    waitForYouTubeAPI(callback, attempts = 0) {
        if (attempts > 150) { // 15 segundos máximo
            console.error('YouTube API não carregou');
            this.showError('API do YouTube não carregou');
            return;
        }
        
        if (window.YT && window.YT.Player && typeof window.YT.Player === 'function') {
            callback();
        } else {
            setTimeout(() => this.waitForYouTubeAPI(callback, attempts + 1), 100);
        }
    }
    
    initPlayer(playerId) {
        if (this.isDestroyed || !document.getElementById(playerId)) {
            return;
        }
        
        try {
            // CORREÇÃO: Usar iframe existente com API do YouTube
            this.player = new YT.Player(playerId, {
                events: {
                    'onReady': (event) => this.onPlayerReady(event),
                    'onStateChange': (event) => this.onPlayerStateChange(event),
                    'onError': (event) => this.onPlayerError(event)
                }
            });
        } catch (error) {
            console.error('Erro ao criar player:', error);
            this.handlePlayerCreationError(playerId);
        }
    }
    
    handlePlayerCreationError(playerId) {
        this.retryCount++;
        if (this.retryCount < this.maxRetries) {
            console.log(`Tentativa ${this.retryCount} de recriar player`);
            setTimeout(() => {
                if (!this.isDestroyed) {
                    this.recreatePlayer();
                }
            }, 1000 * this.retryCount);
        } else {
            this.showError('Não foi possível carregar o player');
        }
    }
    
    onPlayerError(event) {
        console.error('Erro no player YouTube:', event.data);
        
        const errorMessages = {
            2: 'ID do vídeo inválido',
            5: 'Erro de reprodução HTML5',
            100: 'Vídeo não encontrado',
            101: 'Reprodução não permitida',
            150: 'Reprodução não permitida',
            153: 'Erro de configuração do player'
        };
        
        const message = errorMessages[event.data] || `Erro desconhecido (${event.data})`;
        this.showError(message);
        
        // Tentar recriar apenas para alguns tipos de erro
        if ([2, 5, 100, 153].includes(event.data) && this.retryCount < this.maxRetries) {
            setTimeout(() => {
                if (!this.isDestroyed) {
                    this.recreatePlayer();
                }
            }, 2000);
        }
    }
    
    recreatePlayer() {
        this.retryCount++;
        
        try {
            if (this.player && typeof this.player.destroy === 'function') {
                this.player.destroy();
            }
        } catch (e) {
            console.log('Erro ao destruir player anterior:', e);
        }
        
        setTimeout(() => {
            if (!this.isDestroyed && this.retryCount < this.maxRetries) {
                // CORREÇÃO: Recriar iframe mantendo a estrutura HTML
                const videoWrapper = this.elements.iframe.parentElement;
                const newIframe = document.createElement('iframe');
                
                newIframe.className = 'youtube-player';
                newIframe.setAttribute('allowfullscreen', '');
                
                const uniqueId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                newIframe.id = uniqueId;
                newIframe.src = this.buildOptimizedSrc();
                
                // Substituir iframe mantendo posição na estrutura
                videoWrapper.replaceChild(newIframe, this.elements.iframe);
                this.elements.iframe = newIframe;
                
                this.initPlayer(uniqueId);
            }
        }, 500);
    }
    
    setupQuestion() {
        if (this.elements.questionTitle) {
            this.elements.questionTitle.textContent = this.config.question;
        }
        
        if (this.elements.feedback) {
            this.elements.feedback.textContent = this.config.feedback;
        }
        
        if (!this.elements.optionsContainer) return;
        
        this.elements.optionsContainer.innerHTML = '';
        this.config.options.forEach((optionText, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = optionText;
            optionElement.dataset.answer = index;
            
            optionElement.addEventListener('click', () => this.handleOptionClick(optionElement));
            
            this.elements.optionsContainer.appendChild(optionElement);
        });
    }
    
    onPlayerReady(event) {
        if (this.isDestroyed) return;
        
        this.updateStatus('Vídeo carregado. Clique em play!');
        this.retryCount = 0;
        
        try {
            if (this.player && typeof this.player.setPlaybackQuality === 'function') {
                this.player.setPlaybackQuality('hd720');
            }
        } catch (error) {
            console.log('Aviso: não foi possível definir qualidade:', error);
        }
    }
    
    onPlayerStateChange(event) {
        if (this.isDestroyed) return;
        
        try {
            if (event.data === YT.PlayerState.PLAYING) {
                this.startTimeCheck();
                this.updateStatus('Reproduzindo...');
            } else if (event.data === YT.PlayerState.PAUSED && !this.questionShown) {
                this.updateStatus('Pausado');
                this.clearTimeCheck();
            } else if (event.data === YT.PlayerState.ENDED) {
                this.videoEnded = true;
                this.updateStatus('Concluído!');
                this.updateProgress(100);
                this.clearTimeCheck();
            } else if (event.data === YT.PlayerState.BUFFERING) {
                this.updateStatus('Carregando...');
            }
        } catch (error) {
            console.error('Erro no state change:', error);
        }
    }
    
    startTimeCheck() {
        this.clearTimeCheck();
        
        this.timeCheckInterval = setInterval(() => {
            if (this.isDestroyed) {
                this.clearTimeCheck();
                return;
            }
            
            try {
                if (!this.player || typeof this.player.getCurrentTime !== 'function') {
                    return;
                }
                
                const currentTime = this.player.getCurrentTime();
                const duration = this.player.getDuration();
                
                if (duration > 0) {
                    const progress = (currentTime / duration) * 100;
                    this.updateProgress(progress);
                }
                
                if (!this.questionShown && currentTime >= this.config.questionTime && currentTime > 0) {
                    this.showQuestion();
                }
                
                if (this.videoEnded) {
                    this.clearTimeCheck();
                }
            } catch (error) {
                console.error('Erro na verificação de tempo:', error);
                this.clearTimeCheck();
            }
        }, 250);
    }
    
    clearTimeCheck() {
        if (this.timeCheckInterval) {
            clearInterval(this.timeCheckInterval);
            this.timeCheckInterval = null;
        }
    }
    
    showQuestion() {
        if (this.isDestroyed || this.questionShown) return;
        
        try {
            this.questionShown = true;
            this.clearTimeCheck();
            
            if (this.player && typeof this.player.pauseVideo === 'function') {
                this.player.pauseVideo();
            }
            if (this.elements.overlay) {
                this.elements.overlay.style.display = 'flex';
            }
            this.updateStatus('Responda para continuar');
        } catch (error) {
            console.error('Erro ao mostrar pergunta:', error);
        }
    }
    
    hideQuestion() {
        if (this.isDestroyed) return;
        
        try {
            if (this.elements.overlay) {
                this.elements.overlay.style.display = 'none';
            }
            
            setTimeout(() => {
                if (!this.isDestroyed && this.player && typeof this.player.playVideo === 'function') {
                    this.player.playVideo();
                    this.updateStatus('Continuando...');
                    this.startTimeCheck();
                }
            }, 500);
        } catch (error) {
            console.error('Erro ao esconder pergunta:', error);
        }
    }
    
    handleOptionClick(clickedOption) {
        if (this.isDestroyed) return;
        
        try {
            if (this.elements.feedback) {
                this.elements.feedback.style.display = 'block';
            }
            
            const options = this.container.querySelectorAll('.option');
            options.forEach(opt => {
                opt.style.background = '#f5f5f5';
                opt.style.color = '#333';
            });
            
            clickedOption.style.background = '#4ade80';
            clickedOption.style.color = 'white';
            
            setTimeout(() => {
                if (!this.isDestroyed) {
                    this.hideQuestion();
                }
            }, 2500);
        } catch (error) {
            console.error('Erro ao processar clique:', error);
        }
    }
    
    updateStatus(message) {
        if (this.elements.status && !this.isDestroyed) {
            this.elements.status.textContent = message;
        }
    }
    
    updateProgress(percentage) {
        if (this.elements.progressFill && !this.isDestroyed) {
            this.elements.progressFill.style.width = Math.min(100, Math.max(0, percentage)) + '%';
        }
    }
    
    destroy() {
        this.isDestroyed = true;
        this.clearTimeCheck();
        
        try {
            if (this.player && typeof this.player.destroy === 'function') {
                this.player.destroy();
            }
        } catch (error) {
            console.log('Erro ao destruir player:', error);
        }
        
        this.player = null;
    }
    
    pauseSafely() {
        if (this.isDestroyed) return;
        
        try {
            if (this.player && typeof this.player.pauseVideo === 'function') {
                if (this.player.getPlayerState && this.player.getPlayerState() !== YT.PlayerState.UNSTARTED) {
                    this.player.pauseVideo();
                }
            }
        } catch (error) {
            console.log('Erro ao pausar vídeo:', error);
        }
    }
}

// === CONTROLE GLOBAL DOS PLAYERS ===
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
    
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existingScript) {
        return;
    }
    
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onload = () => {
        youtubeAPILoaded = true;
        youtubeAPILoading = false;
        console.log('YouTube API carregada com sucesso');
    };
    tag.onerror = () => {
        youtubeAPILoading = false;
        console.error('Erro ao carregar YouTube API');
    };
    
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Função global para pausar todos os players
window.pauseAllVideoPlayers = function() {
    if (window.videoPlayers && window.videoPlayers.length > 0) {
        window.videoPlayers.forEach(player => {
            if (player && typeof player.pauseSafely === 'function') {
                player.pauseSafely();
            }
        });
    }
};

// Função para inicializar players
window.initializeVideoPlayers = function() {
    const videoContainers = document.querySelectorAll('.video-component');
    
    if (videoContainers.length === 0) {
        console.log('Nenhum container de vídeo encontrado');
        return;
    }
    
    // Limpar players anteriores
    if (window.videoPlayers) {
        window.videoPlayers.forEach(player => {
            if (player && typeof player.destroy === 'function') {
                player.destroy();
            }
        });
    }
    window.videoPlayers = [];
    
    // Criar novos players
    videoContainers.forEach(container => {
        try {
            const player = new InteractiveVideoPlayer(container);
            if (player && !player.isDestroyed) {
                window.videoPlayers.push(player);
            }
        } catch (error) {
            console.error('Erro ao criar player:', error);
        }
    });
    
    console.log(`Inicializados ${window.videoPlayers.length} players de vídeo`);
};

// Inicialização principal
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando sistema...');
    
    // Carregar API do YouTube primeiro
    loadYouTubeAPI();
    
    // Aguardar um tempo para garantir que tudo esteja carregado
    setTimeout(() => {
        window.initializeVideoPlayers();
    }, 2000);
});

// Callback global obrigatório para YouTube API
window.onYouTubeIframeAPIReady = function() {
    youtubeAPILoaded = true;
    youtubeAPILoading = false;
    console.log('YouTube API pronta para uso');
    
    // Reinicializar players se já existirem containers
    setTimeout(() => {
        if (document.querySelectorAll('.video-component').length > 0) {
            window.initializeVideoPlayers();
        }
    }, 500);
};
