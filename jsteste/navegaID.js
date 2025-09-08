// === SCRIPT 1: NAVEGAÇÃO COM HASH + PAGINAÇÃO ===
// Versão corrigida com melhor integração com players de vídeo

let currentPage = 0;
let totalPages = 0;
let isInitialized = false;

// Função aprimorada para pausar todos os vídeos da página atual
function pauseAllVideosOnCurrentPage() {
    const currentPageElement = document.querySelectorAll('.page')[currentPage];
    if (!currentPageElement) return;
    
    // Pausar usando a função global dos players de vídeo
    if (window.pauseAllVideoPlayers) {
        window.pauseAllVideoPlayers();
    }
    
    // Backup: pausar vídeos manualmente
    const videoContainers = currentPageElement.querySelectorAll('.video-component');
    videoContainers.forEach(container => {
        const iframe = container.querySelector('.youtube-player');
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } catch (e) {
                console.log('Erro ao pausar vídeo via postMessage:', e);
            }
        }
    });
    
    // Pausar vídeos HTML5
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
    
    if (!handleInitialHash()) {
        loadLastPage();
    }
    
    updateNavigation();
    updateProgressBar();
    isInitialized = true;
    updateUrlHash();
    
    // Reinicializar players de vídeo quando necessário
    setTimeout(reinitializeVideoPlayersIfNeeded, 500);
}

// Função para reinicializar players se necessário
function reinitializeVideoPlayersIfNeeded() {
    const currentPageElement = document.querySelectorAll('.page')[currentPage];
    if (!currentPageElement) return;
    
    const videoContainers = currentPageElement.querySelectorAll('.video-component');
    if (videoContainers.length > 0 && (!window.videoPlayers || window.videoPlayers.length === 0)) {
        if (window.initializeVideoPlayers) {
            window.initializeVideoPlayers();
        }
    }
}

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

function goToPage(pageNumber) {
    pauseAllVideosOnCurrentPage();
    
    const pages = document.querySelectorAll('.page');
    pages[currentPage].classList.remove('active');
    currentPage = pageNumber;
    pages[currentPage].classList.add('active');
    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
    updateUrlHash();
    
    setTimeout(reinitializeVideoPlayersIfNeeded, 300);
}

function changePage(direction) {
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
    updateUrlHash();
    
    setTimeout(reinitializeVideoPlayersIfNeeded, 300);
}

function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages - 1;
}

function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = ((currentPage + 1) / totalPages) * 100;
        progressBar.style.width = progress + '%';
    }
}

function goToHome() {
    pauseAllVideosOnCurrentPage();
    
    const pages = document.querySelectorAll('.page');
    pages[currentPage].classList.remove('active');
    currentPage = 0;
    pages[currentPage].classList.add('active');
    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
    updateUrlHash();
    
    setTimeout(reinitializeVideoPlayersIfNeeded, 300);
}

// === SISTEMA DE HASH/URL ===
function updateUrlHash() {
    if (!isInitialized) return;
    
    const newHash = `#pagina${String(currentPage).padStart(2, '0')}`;
    
    if (window.location.hash !== newHash) {
        history.replaceState(null, null, newHash);
    }
}

function hashToPageNumber(hash) {
    if (!hash || !hash.startsWith('#pagina')) return null;
    
    const pageStr = hash.replace('#pagina', '');
    const pageNum = parseInt(pageStr);
    
    return (pageNum >= 0 && pageNum < totalPages) ? pageNum : null;
}

function handleInitialHash() {
    const hash = window.location.hash;
    if (!hash) return false;
    
    const pageNum = hashToPageNumber(hash);
    if (pageNum === null) return false;
    
    const pages = document.querySelectorAll('.page');
    if (pages[currentPage]) {
        pages[currentPage].classList.remove('active');
    }
    currentPage = pageNum;
    if (pages[currentPage]) {
        pages[currentPage].classList.add('active');
    }
    
    return true;
}

function handleHashChange() {
    if (!isInitialized) return;
    
    const hash = window.location.hash;
    const pageNum = hashToPageNumber(hash);
    
    if (pageNum !== null && pageNum !== currentPage) {
        pauseAllVideosOnCurrentPage();
        
        const pages = document.querySelectorAll('.page');
        pages[currentPage].classList.remove('active');
        currentPage = pageNum;
        pages[currentPage].classList.add('active');
        
        saveCurrentPage();
        updateNavigation();
        updateProgressBar();
        
        setTimeout(reinitializeVideoPlayersIfNeeded, 300);
    }
}

function goToPageByHash(hash) {
    const pageNum = hashToPageNumber(hash);
    if (pageNum !== null) {
        goToPage(pageNum);
    }
}

// Event Listeners
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

window.addEventListener('hashchange', handleHashChange);

document.addEventListener('DOMContentLoaded', initializePages);
window.addEventListener('load', () => {
    if (totalPages === 0) initializePages();
});

function getShareableUrl(pageNumber) {
    const baseUrl = window.location.href.split('#')[0];
   const hash = `#pagina${String(pageNumber).padStart(2, '0')}`;
    return baseUrl + hash;
}

function debugNavigation() {
    console.log({
        currentPage: currentPage,
        totalPages: totalPages,
        currentHash: window.location.hash,
        shareableUrl: getShareableUrl(currentPage),
        isInitialized: isInitialized
    });
}
