class InteractiveVideoPlayer {
    constructor(container) {
        this.container = container;
        this.player = null;
        this.questionShown = false;
        this.videoEnded = false;
        this.isDestroyed = false; // NOVO: flag para evitar operações após destruição
        this.timeCheckInterval = null; // NOVO: referência para o interval
        
        // Ler configurações dos data attributes
        this.config = {
            videoId: container.dataset.videoId,
            questionTime: parseInt(container.dataset.questionTime),
            question: container.dataset.question,
            options: JSON.parse(container.dataset.options),
            feedback: container.dataset.feedback
        };
        
        this.init();
    }
    
    init() {
        // Encontrar elementos específicos deste player
        this.elements = {
            iframe: this.container.querySelector('.youtube-player'),
            overlay: this.container.querySelector('.question-overlay'),
            questionTitle: this.container.querySelector('.question-title'),
            optionsContainer: this.container.querySelector('.options'),
            feedback: this.container.querySelector('.feedback'),
            progressFill: this.container.querySelector('.progress-fill'),
            status: this.container.querySelector('.video-status')
        };
        
        // CORREÇÃO: Verificar se elementos existem
        if (!this.elements.iframe) {
            console.error('Player iframe não encontrado');
            return;
        }
        
        // Gerar ID único para o iframe
        const uniqueId = 'player_' + Math.random().toString(36).substr(2, 9);
        this.elements.iframe.id = uniqueId;
        
        // Configurar pergunta e opções
        this.setupQuestion();
        
        // CORREÇÃO: Aguardar API do YouTube estar pronta com timeout
        this.waitForYouTubeAPI(() => {
            if (!this.isDestroyed) {
                this.initPlayer(uniqueId);
            }
        });
    }
    
    waitForYouTubeAPI(callback, attempts = 0) {
        // CORREÇÃO: Limite de tentativas para evitar loop infinito
        if (attempts > 100) { // 10 segundos máximo
            console.error('YouTube API não carregou a tempo');
            return;
        }
        
        if (window.YT && window.YT.Player) {
            callback();
        } else {
            setTimeout(() => this.waitForYouTubeAPI(callback, attempts + 1), 100);
        }
    }
    
    initPlayer(playerId) {
        // CORREÇÃO: Verificar se o container ainda existe
        if (this.isDestroyed || !document.getElementById(playerId)) {
            return;
        }
        
        try {
            this.player = new YT.Player(playerId, {
                events: {
                    'onReady': (event) => this.onPlayerReady(event),
                    'onStateChange': (event) => this.onPlayerStateChange(event),
                    'onError': (event) => this.onPlayerError(event) // NOVO: tratamento de erro
                }
            });
        } catch (error) {
            console.error('Erro ao criar player:', error);
        }
    }
    
    // NOVO: Tratamento de erros do player
    onPlayerError(event) {
        console.error('Erro no player YouTube:', event.data);
        this.updateStatus('Erro ao carregar vídeo');
        
        // Tentar recriar o player após erro
        setTimeout(() => {
            if (!this.isDestroyed) {
                this.recreatePlayer();
            }
        }, 2000);
    }
    
    // NOVO: Recriar player em caso de erro
    recreatePlayer() {
        try {
            if (this.player && this.player.destroy) {
                this.player.destroy();
            }
        } catch (e) {
            console.log('Erro ao destruir player:', e);
        }
        
        // Aguardar um pouco antes de recriar
        setTimeout(() => {
            if (!this.isDestroyed) {
                const uniqueId = 'player_' + Math.random().toString(36).substr(2, 9);
                this.elements.iframe.id = uniqueId;
                this.initPlayer(uniqueId);
            }
        }, 500);
    }
    
    setupQuestion() {
        // CORREÇÃO: Verificar se elementos existem antes de usar
        if (this.elements.questionTitle) {
            this.elements.questionTitle.textContent = this.config.question;
        }
        
        if (this.elements.feedback) {
            this.elements.feedback.textContent = this.config.feedback;
        }
        
        if (!this.elements.optionsContainer) return;
        
        // Criar opções
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
        
        // CORREÇÃO: Verificar se player e método existem
        try {
            if (this.player && typeof this.player.setPlaybackQuality === 'function') {
                this.player.setPlaybackQuality('hd1080');
            }
        } catch (error) {
            console.log('Erro ao definir qualidade:', error);
        }
    }
    
    onPlayerStateChange(event) {
        if (this.isDestroyed) return;
        
        try {
            if (event.data == YT.PlayerState.PLAYING) {
                this.startTimeCheck();
                this.updateStatus('Reproduzindo...');
            } else if (event.data == YT.PlayerState.PAUSED && !this.questionShown) {
                this.updateStatus('Pausado');
            } else if (event.data == YT.PlayerState.ENDED) {
                this.videoEnded = true;
                this.updateStatus('Concluído!');
                this.updateProgress(100);
                this.clearTimeCheck(); // NOVO: limpar interval
            }
        } catch (error) {
            console.error('Erro no state change:', error);
        }
    }
    
    startTimeCheck() {
        // CORREÇÃO: Limpar interval anterior se existir
        this.clearTimeCheck();
        
        this.timeCheckInterval = setInterval(() => {
            if (this.isDestroyed) {
                this.clearTimeCheck();
                return;
            }
            
            try {
                if (this.player && typeof this.player.getCurrentTime === 'function') {
                    const currentTime = this.player.getCurrentTime();
                    const duration = this.player.getDuration();
                    
                    if (duration > 0) {
                        const progress = (currentTime / duration) * 100;
                        this.updateProgress(progress);
                    }
                    
                    if (!this.questionShown && currentTime >= this.config.questionTime) {
                        this.showQuestion();
                        this.clearTimeCheck();
                    }
                    
                    if (this.videoEnded) {
                        this.clearTimeCheck();
                    }
                } else {
                    // Player não está disponível, parar verificação
                    this.clearTimeCheck();
                }
            } catch (error) {
                console.error('Erro na verificação de tempo:', error);
                this.clearTimeCheck();
            }
        }, 100);
    }
    
    // NOVO: Método para limpar interval
    clearTimeCheck() {
        if (this.timeCheckInterval) {
            clearInterval(this.timeCheckInterval);
            this.timeCheckInterval = null;
        }
    }
    
    showQuestion() {
        if (this.isDestroyed) return;
        
        try {
            this.questionShown = true;
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
            if (this.player && typeof this.player.playVideo === 'function') {
                this.player.playVideo();
            }
            this.updateStatus('Continuando...');
        } catch (error) {
            console.error('Erro ao esconder pergunta:', error);
        }
    }
    
    handleOptionClick(clickedOption) {
        if (this.isDestroyed) return;
        
        try {
            // Mostrar feedback
            if (this.elements.feedback) {
                this.elements.feedback.style.display = 'block';
            }
            
            // Destacar opção selecionada
            const options = this.container.querySelectorAll('.option');
            options.forEach(opt => {
                opt.style.background = '#f5f5f5';
                opt.style.color = '#333';
            });
            
            clickedOption.style.background = '#4ade80';
            clickedOption.style.color = 'white';
            
            // Continuar vídeo após 2 segundos
            setTimeout(() => {
                if (!this.isDestroyed) {
                    this.hideQuestion();
                }
            }, 2000);
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
            this.elements.progressFill.style.width = percentage + '%';
        }
    }
    
    // NOVO: Método para destruir player
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
    
    // NOVO: Método para pausar player de forma segura
    pauseSafely() {
        if (this.isDestroyed) return;
        
        try {
            if (this.player && typeof this.player.pauseVideo === 'function') {
                this.player.pauseVideo();
            }
        } catch (error) {
            console.log('Erro ao pausar vídeo:', error);
        }
    }
}

// CORREÇÃO: Melhor controle de carregamento da API
let youtubeAPILoaded = false;
let youtubeAPILoading = false;

function loadYouTubeAPI() {
    if (youtubeAPILoaded || youtubeAPILoading) return;
    
    youtubeAPILoading = true;
    
    // Verificar se já existe
    if (window.YT && window.YT.Player) {
        youtubeAPILoaded = true;
        return;
    }
    
    // Verificar se script já foi adicionado
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existingScript) {
        return;
    }
    
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onload = () => {
        youtubeAPILoaded = true;
        youtubeAPILoading = false;
    };
    tag.onerror = () => {
        youtubeAPILoading = false;
        console.error('Erro ao carregar YouTube API');
    };
    
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// NOVO: Armazenar instâncias dos players para controle
window.videoPlayers = window.videoPlayers || [];

// CORREÇÃO: Função para pausar todos os players de forma segura
function pauseAllVideoPlayers() {
    if (window.videoPlayers) {
        window.videoPlayers.forEach(player => {
            if (player && typeof player.pauseSafely === 'function') {
                player.pauseSafely();
            }
        });
    }
}

// CORREÇÃO: Inicialização mais robusta
document.addEventListener('DOMContentLoaded', function() {
    // Carregar API do YouTube
    loadYouTubeAPI();
    
    // CORREÇÃO: Aguardar mais tempo e verificar se elementos existem
    setTimeout(() => {
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
                window.videoPlayers.push(player);
            } catch (error) {
                console.error('Erro ao criar player:', error);
            }
        });
    }, 1500); // CORREÇÃO: Tempo maior para garantir carregamento
});

// NOVO: Callback global para YouTube API
window.onYouTubeIframeAPIReady = function() {
    youtubeAPILoaded = true;
    youtubeAPILoading = false;
    console.log('YouTube API carregada');
};
