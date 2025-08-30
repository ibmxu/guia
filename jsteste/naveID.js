// === SISTEMA HÍBRIDO: HASH + PAGINAÇÃO EXISTENTE ===
// Versão corrigida e simplificada

let currentPage = 0;
let totalPages = 0;
let isInitialized = false;

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
    
    // Verificar se existe hash na URL antes de carregar última página
    if (!handleInitialHash()) {
        loadLastPage();
    }
    
    updateNavigation();
    updateProgressBar();
    isInitialized = true;
    
    // Atualizar hash inicial
    updateUrlHash();
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
    
    // Atualizar hash da URL
    updateUrlHash();
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
    
    // Atualizar hash da URL
    updateUrlHash();
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
    // Pausar vídeos da página atual antes de sair
    pauseAllVideosOnCurrentPage();
    
    const pages = document.querySelectorAll('.page');
    pages[currentPage].classList.remove('active');
    currentPage = 0;
    pages[currentPage].classList.add('active');
    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
    
    // Atualizar hash da URL
    updateUrlHash();
}

// === SISTEMA DE HASH/URL ===

// Atualiza o hash da URL baseado na página atual
function updateUrlHash() {
    if (!isInitialized) return;
    
    const newHash = `#pagina${String(currentPage + 1).padStart(2, '0')}`;
    
    // Atualizar URL sem recarregar a página
    if (window.location.hash !== newHash) {
        history.replaceState(null, null, newHash);
    }
}

// Converte hash para número da página
function hashToPageNumber(hash) {
    if (!hash || !hash.startsWith('#pagina')) return null;
    
    const pageStr = hash.replace('#pagina', '');
    const pageNum = parseInt(pageStr) - 1; // -1 porque páginas começam em 0
    
    return (pageNum >= 0 && pageNum < totalPages) ? pageNum : null;
}

// Lida com hash inicial quando página carrega
function handleInitialHash() {
    const hash = window.location.hash;
    if (!hash) return false;
    
    const pageNum = hashToPageNumber(hash);
    if (pageNum === null) return false;
    
    // Ir para a página especificada no hash
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

// Lida com mudanças no hash (botão voltar/avançar do navegador)
function handleHashChange() {
    if (!isInitialized) return;
    
    const hash = window.location.hash;
    const pageNum = hashToPageNumber(hash);
    
    if (pageNum !== null && pageNum !== currentPage) {
        // Navegar para a página do hash
        pauseAllVideosOnCurrentPage();
        
        const pages = document.querySelectorAll('.page');
        pages[currentPage].classList.remove('active');
        currentPage = pageNum;
        pages[currentPage].classList.add('active');
        
        saveCurrentPage();
        updateNavigation();
        updateProgressBar();
    }
}

// === FUNÇÃO PÚBLICA PARA LINKS EXTERNOS ===
function goToPageByHash(hash) {
    const pageNum = hashToPageNumber(hash);
    if (pageNum !== null) {
        goToPage(pageNum);
    }
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

// Event listener para mudanças no hash
window.addEventListener('hashchange', handleHashChange);

document.addEventListener('DOMContentLoaded', initializePages);
window.addEventListener('load', () => {
    if (totalPages === 0) initializePages();
});

// === FUNÇÕES DE UTILIDADE ===

// Gera URLs compartilháveis para páginas específicas
function getShareableUrl(pageNumber) {
    const baseUrl = window.location.href.split('#')[0];
    const hash = `#pagina${String(pageNumber + 1).padStart(2, '0')}`;
    return baseUrl + hash;
}

// Função para debug - mostra informações do sistema
function debugNavigation() {
    console.log({
        currentPage: currentPage,
        totalPages: totalPages,
        currentHash: window.location.hash,
        shareableUrl: getShareableUrl(currentPage),
        isInitialized: isInitialized
    });
}
