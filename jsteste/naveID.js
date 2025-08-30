// === SEU CÓDIGO ORIGINAL COM CORREÇÃO APENAS NO HASH ===

let currentPage = 0;
let totalPages = 0;
let isInitialized = false;

// Função para pausar todos os vídeos da página atual (SUA FUNÇÃO ORIGINAL)
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

// SUA FUNÇÃO ORIGINAL
function initializePages() {
    const pages = document.querySelectorAll('.page');
    totalPages = pages.length;
    
    // CORREÇÃO: Só verifica hash se não interferir com vídeos
    if (window.location.hash && !hasActiveVideo()) {
        handleInitialHash();
    } else {
        loadLastPage();
    }
    
    updateNavigation();
    updateProgressBar();
    isInitialized = true;
}

// === SEU CÓDIGO ORIGINAL DE LOCAL STORAGE ===
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

// === SUAS FUNÇÕES ORIGINAIS DE NAVEGAÇÃO ===
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
    
    // CORREÇÃO: Só atualiza hash se não tiver vídeo ativo
    updateUrlHashSafe();
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
    
    // CORREÇÃO: Só atualiza hash se não tiver vídeo ativo
    updateUrlHashSafe();
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
    
    // CORREÇÃO: Só atualiza hash se não tiver vídeo ativo
    updateUrlHashSafe();
}

// === SISTEMA DE HASH CORRIGIDO (SEM INTERFERIR COM VÍDEOS) ===

// NOVA: Verifica se há vídeo ativo na página atual
function hasActiveVideo() {
    const currentPageElement = document.querySelectorAll('.page')[currentPage];
    if (!currentPageElement) return false;
    
    // Verifica se há vídeos HTML5 reproduzindo
    const html5Videos = currentPageElement.querySelectorAll('video');
    for (let video of html5Videos) {
        if (!video.paused && !video.ended) {
            return true;
        }
    }
    
    // Verifica se há players do YouTube ativos
    const iframes = currentPageElement.querySelectorAll('.youtube-player');
    for (let iframe of iframes) {
        const playerId = iframe.id;
        if (playerId && window.YT && window.YT.get) {
            try {
                const player = window.YT.get(playerId);
                if (player && player.getPlayerState && player.getPlayerState() === 1) { // 1 = playing
                    return true;
                }
            } catch (e) {
                // Ignora erros
            }
        }
    }
    
    return false;
}

// CORREÇÃO: Atualiza hash apenas quando seguro
function updateUrlHashSafe() {
    if (!isInitialized) return;
    
    // CORREÇÃO: Não atualiza hash se há vídeo reproduzindo
    if (hasActiveVideo()) {
        return;
    }
    
    const newHash = `#pagina${String(currentPage + 1).padStart(2, '0')}`;
    
    // CORREÇÃO: Usar replaceState silenciosamente
    if (window.location.hash !== newHash) {
        const url = window.location.href.split('#')[0] + newHash;
        window.history.replaceState(null, document.title, url);
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

// CORREÇÃO: Hash change mais conservador
function handleHashChange() {
    if (!isInitialized) return;
    
    // CORREÇÃO: Não processa hash change se há vídeo ativo
    if (hasActiveVideo()) {
        return;
    }
    
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

// === SEUS EVENT LISTENERS ORIGINAIS ===
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

// CORREÇÃO: Hash change listener mais suave
window.addEventListener('hashchange', handleHashChange);

// SEUS EVENT LISTENERS ORIGINAIS
document.addEventListener('DOMContentLoaded', initializePages);
window.addEventListener('load', () => {
    if (totalPages === 0) initializePages();
});

// === FUNÇÕES DE UTILIDADE ===
function getShareableUrl(pageNumber) {
    const baseUrl = window.location.href.split('#')[0];
    const hash = `#pagina${String(pageNumber + 1).padStart(2, '0')}`;
    return baseUrl + hash;
}

function debugNavigation() {
    console.log({
        currentPage: currentPage,
        totalPages: totalPages,
        currentHash: window.location.hash,
        shareableUrl: getShareableUrl(currentPage),
        isInitialized: isInitialized,
        hasActiveVideo: hasActiveVideo()
    });
}
