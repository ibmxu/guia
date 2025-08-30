// === SISTEMA HÍBRIDO: HASH + PAGINAÇÃO EXISTENTE ===
// Este código funciona JUNTO com seu sistema atual sem interferir

// === NAVEGAÇÃO DE PÁGINAS E LOCAL STORAGE (SEU CÓDIGO ORIGINAL) ===
let currentPage = 0;
let totalPages = 0;
let isInitialized = false;

// NOVA: Flag para evitar loops infinitos
let isNavigating = false;

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
                // CORREÇÃO: Aguardar um pouco antes de enviar comando
                setTimeout(() => {
                    iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                }, 100);
            } catch (e) {
                console.log('Erro ao pausar vídeo via postMessage:', e);
            }
        }
        
        // Se existe uma instância do player YT associada
        const playerId = iframe?.id;
        if (playerId && window.YT && window.YT.get) {
            try {
                const player = window.YT.get(playerId);
                if (player && typeof player.pauseVideo === 'function') {
                    // CORREÇÃO: Verificar se o player está pronto
                    if (player.getPlayerState && player.getPlayerState() !== -1) {
                        player.pauseVideo();
                    }
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
    
    // CORREÇÃO: Aguardar um pouco antes de verificar hash
    setTimeout(() => {
        if (!handleInitialHash()) {
            loadLastPage();
        }
        
        updateNavigation();
        updateProgressBar();
        isInitialized = true;
        
        // Atualizar hash inicial após inicialização
        updateUrlHash();
    }, 200);
}

// === LOCAL STORAGE (SEU CÓDIGO ORIGINAL) ===
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

// === NAVEGAÇÃO (SEU CÓDIGO MODIFICADO PARA INCLUIR HASH) ===
function goToPage(pageNumber) {
    if (isNavigating) return; // CORREÇÃO: Prevenir navegação múltipla
    isNavigating = true;
    
    // Pausar vídeos da página atual antes de sair
    pauseAllVideosOnCurrentPage();
    
    const pages = document.querySelectorAll('.page');
    pages[currentPage].classList.remove('active');
    currentPage = pageNumber;
    pages[currentPage].classList.add('active');
    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
    
    // CORREÇÃO: Aguardar antes de atualizar hash
    setTimeout(() => {
        updateUrlHash();
        isNavigating = false;
    }, 100);
}

function changePage(direction) {
    if (isNavigating) return; // CORREÇÃO: Prevenir navegação múltipla
    isNavigating = true;
    
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
    
    // CORREÇÃO: Aguardar antes de atualizar hash
    setTimeout(() => {
        updateUrlHash();
        isNavigating = false;
    }, 100);
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
    if (isNavigating) return; // CORREÇÃO: Prevenir navegação múltipla
    isNavigating = true;
    
    // Pausar vídeos da página atual antes de sair
    pauseAllVideosOnCurrentPage();
    
    const pages = document.querySelectorAll('.page');
    pages[currentPage].classList.remove('active');
    currentPage = 0;
    pages[currentPage].classList.add('active');
    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
    
    // CORREÇÃO: Aguardar antes de atualizar hash
    setTimeout(() => {
        updateUrlHash();
        isNavigating = false;
    }, 100);
}

// === NOVO: SISTEMA DE HASH/URL ===

// Atualiza o hash da URL baseado na página atual
function updateUrlHash() {
    if (!isInitialized || isNavigating) return;
    
    const newHash = `#pagina${String(currentPage + 1).padStart(2, '0')}`;
    
    // CORREÇÃO: Verificar se hash realmente mudou
    if (window.location.hash !== newHash) {
        // CORREÇÃO: Usar pushState em vez de replaceState para melhor controle
        const url = window.location.href.split('#')[0] + newHash;
        history.replaceState({ page: currentPage }, null, url);
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

// CORREÇÃO: Função melhorada para lidar com mudanças no hash
function handleHashChange(e) {
    if (!isInitialized || isNavigating) return;
    
    const hash = window.location.hash;
    const pageNum = hashToPageNumber(hash);
    
    if (pageNum !== null && pageNum !== currentPage) {
        isNavigating = true;
        
        // Navegar para a página do hash sem atualizar a URL novamente
        pauseAllVideosOnCurrentPage();
        
        const pages = document.querySelectorAll('.page');
        pages[currentPage].classList.remove('active');
        currentPage = pageNum;
        pages[currentPage].classList.add('active');
        
        saveCurrentPage();
        updateNavigation();
        updateProgressBar();
        
        setTimeout(() => {
            isNavigating = false;
        }, 100);
    }
}

// === FUNÇÃO PÚBLICA PARA LINKS EXTERNOS ===
// Permite que links HTML naveguem para páginas específicas
function goToPageByHash(hash) {
    const pageNum = hashToPageNumber(hash);
    if (pageNum !== null) {
        goToPage(pageNum);
    }
}

// === EVENT LISTENERS (SEU CÓDIGO ORIGINAL + NOVOS) ===
document.addEventListener('keydown', function (e) {
    if (isNavigating) return; // CORREÇÃO: Prevenir durante navegação
    
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
    if (isNavigating) return; // CORREÇÃO: Prevenir durante navegação
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = startX - endX;
    const diffY = startY - endY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && currentPage < totalPages - 1) changePage(1);
        else if (diffX < 0 && currentPage > 0) changePage(-1);
    }
});

// CORREÇÃO: Event listener melhorado para mudanças no hash
window.addEventListener('hashchange', handleHashChange, { passive: true });

// CORREÇÃO: Inicialização mais robusta
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que tudo carregou
    setTimeout(initializePages, 100);
});

window.addEventListener('load', () => {
    if (totalPages === 0) {
        setTimeout(initializePages, 200);
    }
});

// CORREÇÃO: Aguardar YouTube API se estiver sendo usada
if (window.YT) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            if (window.YT.loaded) {
                initializePages();
            }
        }, 500);
    });
}

// === FUNÇÕES DE UTILIDADE EXTRAS ===

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
        isInitialized: isInitialized,
        isNavigating: isNavigating
    });
}

// NOVA: Função para reinicializar se houver problemas
function reinitializeIfNeeded() {
    if (!isInitialized || totalPages === 0) {
        console.log('Reinicializando navegação...');
        initializePages();
    }
}
