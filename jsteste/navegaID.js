// === main.js ===
// Navegação entre páginas com hash, progresso e histórico

window.currentPage = 0;
let totalPages = 0;
let isInitialized = false;

// Inicializa as páginas e aplica o hash correto
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

    // Garante que os players de vídeo sejam reinicializados
    setTimeout(reinitializeVideoPlayersIfNeeded, 500);
}

function loadLastPage() {
    const savedPage = localStorage.getItem('guiaCiencias_ultimaPagina');
    if (savedPage !== null) {
        const pageNumber = parseInt(savedPage);
        if (pageNumber >= 0 && pageNumber < totalPages) {
            const pages = document.querySelectorAll('.page');
            pages[window.currentPage].classList.remove('active');
            window.currentPage = pageNumber;
            pages[window.currentPage].classList.add('active');
        }
    }
}

function saveCurrentPage() {
    localStorage.setItem('guiaCiencias_ultimaPagina', window.currentPage.toString());
}

// Ir diretamente a uma página
function goToPage(pageNumber) {
    pauseAllVideosOnCurrentPage();

    const pages = document.querySelectorAll('.page');
    pages[window.currentPage].classList.remove('active');
    window.currentPage = pageNumber;
    pages[window.currentPage].classList.add('active');

    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
    updateUrlHash();

    setTimeout(reinitializeVideoPlayersIfNeeded, 300);
}

// Avançar ou voltar
function changePage(direction) {
    pauseAllVideosOnCurrentPage();

    const pages = document.querySelectorAll('.page');
    pages[window.currentPage].classList.remove('active');
    window.currentPage += direction;
    if (window.currentPage < 0) window.currentPage = totalPages - 1;
    if (window.currentPage >= totalPages) window.currentPage = 0;
    pages[window.currentPage].classList.add('active');

    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
    updateUrlHash();

    setTimeout(reinitializeVideoPlayersIfNeeded, 300);
}

// Atualiza botões
function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.disabled = window.currentPage === 0;
    if (nextBtn) nextBtn.disabled = window.currentPage === totalPages - 1;
}

// Atualiza barra de progresso
function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = ((window.currentPage + 1) / totalPages) * 100;
        progressBar.style.width = progress + '%';
    }
}

// Voltar para a página inicial
function goToHome() {
    pauseAllVideosOnCurrentPage();

    const pages = document.querySelectorAll('.page');
    pages[window.currentPage].classList.remove('active');
    window.currentPage = 0;
    pages[window.currentPage].classList.add('active');

    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
    updateUrlHash();

    setTimeout(reinitializeVideoPlayersIfNeeded, 300);
}

// === SISTEMA DE HASH/URL ===
function updateUrlHash() {
    if (!isInitialized) return;
    const newHash = `#pagina${String(window.currentPage).padStart(2, '0')}`;
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
    if (pages[window.currentPage]) {
        pages[window.currentPage].classList.remove('active');
    }
    window.currentPage = pageNum;
    if (pages[window.currentPage]) {
        pages[window.currentPage].classList.add('active');
    }

    return true;
}

function handleHashChange() {
    if (!isInitialized) return;

    const hash = window.location.hash;
    const pageNum = hashToPageNumber(hash);

    if (pageNum !== null && pageNum !== window.currentPage) {
        pauseAllVideosOnCurrentPage();

        const pages = document.querySelectorAll('.page');
        pages[window.currentPage].classList.remove('active');
        window.currentPage = pageNum;
        pages[window.currentPage].classList.add('active');

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

// === EVENTOS DE TECLADO E TOQUE ===
document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' && window.currentPage > 0) changePage(-1);
    if (e.key === 'ArrowRight' && window.currentPage < totalPages - 1) changePage(1);
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
        if (diffX > 0 && window.currentPage < totalPages - 1) changePage(1);
        else if (diffX < 0 && window.currentPage > 0) changePage(-1);
    }
});

window.addEventListener('hashchange', handleHashChange);

document.addEventListener('DOMContentLoaded', initializePages);
window.addEventListener('load', () => {
    if (totalPages === 0) initializePages();
});

// === DEBUG ===
function getShareableUrl(pageNumber) {
    const baseUrl = window.location.href.split('#')[0];
    const hash = `#pagina${String(pageNumber).padStart(2, '0')}`;
    return baseUrl + hash;
}

function debugNavigation() {
    console.log({
        currentPage: window.currentPage,
        totalPages: totalPages,
        currentHash: window.location.hash,
        shareableUrl: getShareableUrl(window.currentPage),
        isInitialized: isInitialized
    });
}
