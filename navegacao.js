// === NAVEGAÇÃO DE PÁGINAS E LOCAL STORAGE ===
let currentPage = 0;
let totalPages = 0;

// Função para pausar todos os vídeos da página atual
function pauseAllVideosOnCurrentPage() {
    const currentPageElement = document.querySelectorAll('.page')[currentPage];
    if (!currentPageElement) return;
    
    // Encontrar todos os containers de vídeo na página atual
    const videoContainers = currentPageElement.querySelectorAll('.video-component');
    
    videoContainers.forEach(container => {
        // Procurar pelo iframe do YouTube dentro do container
        const iframe = container.querySelector('.youtube-player');
        if (iframe && iframe.contentWindow) {
            try {
                // Tentar pausar usando postMessage (método mais confiável)
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } catch (e) {
                console.log('Erro ao pausar vídeo via postMessage:', e);
            }
        }
        
        // Se existe uma instância do player YT associada
        const playerId = iframe?.id;
        if (playerId && window.YT && window.YT.get) {
            try {
                const player = window.YT.get(playerId);
                if (player && player.pauseVideo) {
                    player.pauseVideo();
                }
            } catch (e) {
                console.log('Erro ao pausar vídeo via YT API:', e);
            }
        }
    });
    
    // Também pausar vídeos HTML5 convencionais (se houver)
    const html5Videos = currentPageElement.querySelectorAll('video');
    html5Videos.forEach(video => {
        if (!video.paused) {
            video.pause();
        }
    });
}

function initializePages() {
    const pages = document.querySelectorAll('.page');
    totalPages = pages.length;
    loadLastPage();
    updateNavigation();
    updateProgressBar();
}

// === LOCAL STORAGE ===
function loadLastPage() {
    const savedPage = localStorage.getItem('guiaCiencias_ultimaPagina');
    if (savedPage !== null) {
        const pageNumber = parseInt(savedPage);
        if (pageNumber >= 0 && pageNumber < totalPages) {
            const pages = document.querySelectorAll('.page');
            pages[currentPage].classList.remove('active');
            currentPage = pageNumber;
            pages[currentPage].classList.add('active');
        }
    }
}

function saveCurrentPage() {
    localStorage.setItem('guiaCiencias_ultimaPagina', currentPage.toString());
}

// === NAVEGAÇÃO ===
function goToPage(pageNumber) {
    // Pausar vídeos da página atual antes de sair
    pauseAllVideosOnCurrentPage();
    
    const pages = document.querySelectorAll('.page');
    pages[currentPage].classList.remove('active');
    currentPage = pageNumber;
    pages[currentPage].classList.add('active');
    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
}

function changePage(direction) {
    // Pausar vídeos da página atual antes de sair
    pauseAllVideosOnCurrentPage();
    
    const pages = document.querySelectorAll('.page');
    pages[currentPage].classList.remove('active');
    currentPage += direction;
    if (currentPage < 0) currentPage = totalPages - 1;
    if (currentPage >= totalPages) currentPage = 0;
    pages[currentPage].classList.add('active');
    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
}

function updateNavigation() {
    document.getElementById('prevBtn').disabled = currentPage === 0;
    document.getElementById('nextBtn').disabled = currentPage === totalPages - 1;
}

function updateProgressBar() {
    const progress = ((currentPage + 1) / totalPages) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

function goToHome() {
    // Pausar vídeos da página atual antes de sair
    pauseAllVideosOnCurrentPage();
    
    const pages = document.querySelectorAll('.page');
    pages[currentPage].classList.remove('active');
    currentPage = 0;
    pages[currentPage].classList.add('active');
    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
}

// === EVENT LISTENERS ===
document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' && currentPage > 0) changePage(-1);
    if (e.key === 'ArrowRight' && currentPage < totalPages - 1) changePage(1);
});

let startX = 0;
let startY = 0;
document.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

document.addEventListener('touchend', function (e) {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = startX - endX;
    const diffY = startY - endY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && currentPage < totalPages - 1) changePage(1);
        else if (diffX < 0 && currentPage > 0) changePage(-1);
    }
});

document.addEventListener('DOMContentLoaded', initializePages);
window.addEventListener('load', () => {
    if (totalPages === 0) initializePages();
});
