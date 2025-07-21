let player;
let questionShown = false;
let videoEnded = false;
const QUESTION_TIME = 20;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    updateStatus('Vídeo carregado. Clique em play!');
    // Forçar qualidade HD se disponível
    if (player && player.setPlaybackQuality) {
        player.setPlaybackQuality('hd1080');
    }
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        startTimeCheck();
        updateStatus('Reproduzindo...');
    } else if (event.data == YT.PlayerState.PAUSED && !questionShown) {
        updateStatus('Pausado');
    } else if (event.data == YT.PlayerState.ENDED) {
        videoEnded = true;
        updateStatus('Concluído!');
        updateProgress(100);
    }
}

function startTimeCheck() {
    const checkTime = setInterval(() => {
        if (player && player.getCurrentTime) {
            const currentTime = player.getCurrentTime();
            const duration = player.getDuration();

            if (duration > 0) {
                const progress = (currentTime / duration) * 100;
                updateProgress(progress);
            }

            if (!questionShown && currentTime >= QUESTION_TIME) {
                showQuestion();
                clearInterval(checkTime);
            }

            if (videoEnded) {
                clearInterval(checkTime);
            }
        }
    }, 100);
}

function showQuestion() {
    questionShown = true;
    player.pauseVideo();
    document.getElementById('question-overlay').style.display = 'flex';
    updateStatus('Responda para continuar');
}

function hideQuestion() {
    document.getElementById('question-overlay').style.display = 'none';
    player.playVideo();
    updateStatus('Continuando...');
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

function updateProgress(percentage) {
    document.getElementById('progress-fill').style.width = percentage + '%';
}

document.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', function() {
        document.getElementById('feedback').style.display = 'block';

        document.querySelectorAll('.option').forEach(opt => {
            opt.style.background = '#f5f5f5';
            opt.style.color = '#333';
        });

        this.style.background = '#4ade80';
        this.style.color = 'white';

        setTimeout(() => {
            hideQuestion();
        }, 2000);
    });
});

if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
