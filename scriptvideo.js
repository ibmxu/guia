
        class InteractiveVideoPlayer {
            constructor(container) {
                this.container = container;
                this.player = null;
                this.questionShown = false;
                this.videoEnded = false;
                
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
                
                // Gerar ID único para o iframe
                const uniqueId = 'player_' + Math.random().toString(36).substr(2, 9);
                this.elements.iframe.id = uniqueId;
                
                // Configurar pergunta e opções
                this.setupQuestion();
                
                // Aguardar API do YouTube estar pronta
                this.waitForYouTubeAPI(() => {
                    this.initPlayer(uniqueId);
                });
            }
            
            waitForYouTubeAPI(callback) {
                if (window.YT && window.YT.Player) {
                    callback();
                } else {
                    setTimeout(() => this.waitForYouTubeAPI(callback), 100);
                }
            }
            
            initPlayer(playerId) {
                this.player = new YT.Player(playerId, {
                    events: {
                        'onReady': (event) => this.onPlayerReady(event),
                        'onStateChange': (event) => this.onPlayerStateChange(event)
                    }
                });
            }
            
            setupQuestion() {
                // Configurar título da pergunta
                this.elements.questionTitle.textContent = this.config.question;
                
                // Configurar feedback
                this.elements.feedback.textContent = this.config.feedback;
                
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
                this.updateStatus('Vídeo carregado. Clique em play!');
                // Forçar qualidade HD
                if (this.player && this.player.setPlaybackQuality) {
                    this.player.setPlaybackQuality('hd1080');
                }
            }
            
            onPlayerStateChange(event) {
                if (event.data == YT.PlayerState.PLAYING) {
                    this.startTimeCheck();
                    this.updateStatus('Reproduzindo...');
                } else if (event.data == YT.PlayerState.PAUSED && !this.questionShown) {
                    this.updateStatus('Pausado');
                } else if (event.data == YT.PlayerState.ENDED) {
                    this.videoEnded = true;
                    this.updateStatus('Concluído!');
                    this.updateProgress(100);
                }
            }
            
            startTimeCheck() {
                const checkTime = setInterval(() => {
                    if (this.player && this.player.getCurrentTime) {
                        const currentTime = this.player.getCurrentTime();
                        const duration = this.player.getDuration();
                        
                        if (duration > 0) {
                            const progress = (currentTime / duration) * 100;
                            this.updateProgress(progress);
                        }
                        
                        if (!this.questionShown && currentTime >= this.config.questionTime) {
                            this.showQuestion();
                            clearInterval(checkTime);
                        }
                        
                        if (this.videoEnded) {
                            clearInterval(checkTime);
                        }
                    }
                }, 100);
            }
            
            showQuestion() {
                this.questionShown = true;
                this.player.pauseVideo();
                this.elements.overlay.style.display = 'flex';
                this.updateStatus('Responda para continuar');
            }
            
            hideQuestion() {
                this.elements.overlay.style.display = 'none';
                this.player.playVideo();
                this.updateStatus('Continuando...');
            }
            
            handleOptionClick(clickedOption) {
                // Mostrar feedback
                this.elements.feedback.style.display = 'block';
                
                // Destacar opção selecionada
                this.container.querySelectorAll('.option').forEach(opt => {
                    opt.style.background = '#f5f5f5';
                    opt.style.color = '#333';
                });
                
                clickedOption.style.background = '#4ade80';
                clickedOption.style.color = 'white';
                
                // Continuar vídeo após 2 segundos
                setTimeout(() => {
                    this.hideQuestion();
                }, 2000);
            }
            
            updateStatus(message) {
                this.elements.status.textContent = message;
            }
            
            updateProgress(percentage) {
                this.elements.progressFill.style.width = percentage + '%';
            }
        }
        
        // Função para carregar API do YouTube
        function loadYouTubeAPI() {
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }
        }
        
        // Inicializar quando a página carregar
        document.addEventListener('DOMContentLoaded', function() {
            // Carregar API do YouTube
            loadYouTubeAPI();
            
            // Aguardar um pouco e então inicializar os players
            setTimeout(() => {
                const videoContainers = document.querySelectorAll('.video-component');
                videoContainers.forEach(container => {
                    new InteractiveVideoPlayer(container);
                });
            }, 1000);
        });
  
