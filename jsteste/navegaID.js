
// Script que controla a navegação entre páginas 
// Ele também lembra a última página vista, atualiza o endereço (hash) e pausa vídeos automaticamente.

// -----------------------------
// VARIÁVEIS PRINCIPAIS
// -----------------------------

// Guarda o número da página atual (começa em 0, a primeira)
window.currentPage = 0;

// Guarda o total de páginas encontradas no HTML
let totalPages = 0;

// Indica se o sistema já foi iniciado
let isInitialized = false;


// -----------------------------
// CONTROLE DE VÍDEOS
// -----------------------------
// Essa parte pausa vídeos quando mudamos de página.

function pauseAllVideosOnCurrentPage() {
    // Encontra o elemento da página atual
    const currentPageElement = document.querySelectorAll('.page')[window.currentPage];
    if (!currentPageElement) return;

    // 1️⃣ Se existir uma função global para pausar players, usamos ela
    if (window.pauseAllVideoPlayers) {
        window.pauseAllVideoPlayers();
    }

    // 2️⃣ Caso contrário, tentamos pausar manualmente os vídeos do YouTube (iframes)
    const videoContainers = currentPageElement.querySelectorAll('.video-component');
    videoContainers.forEach(container => {
        const iframe = container.querySelector('.youtube-player');
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } catch (e) {
                console.log('Erro ao pausar vídeo do YouTube:', e);
            }
        }
    });

    // 3️⃣ E, por último, pausamos vídeos HTML5 normais (como arquivos .mp4 no site)
    const html5Videos = currentPageElement.querySelectorAll('video');
    html5Videos.forEach(video => {
        if (!video.paused) video.pause();
    });
}


// -----------------------------
// INICIALIZAÇÃO DAS PÁGINAS
// -----------------------------

function initializePages() {
    // Encontra todas as páginas (elementos com classe .page)
    const pages = document.querySelectorAll('.page');
    totalPages = pages.length;

    // Verifica se existe um hash na URL (ex: #pagina03)
    // Se não houver, tenta carregar a última página visitada do armazenamento local
    if (!handleInitialHash()) {
        loadLastPage();
    }

    // Atualiza botões e barra de progresso
    updateNavigation();
    updateProgressBar();

    // Marca o sistema como iniciado
    isInitialized = true;

    // Atualiza o hash da URL (para #pagina00, #pagina01, etc.)
    updateUrlHash();

    // Reinicia os players de vídeo (caso existam)
    setTimeout(reinitializeVideoPlayersIfNeeded, 500);
}

// Reinicializa vídeos, se necessário
function reinitializeVideoPlayersIfNeeded() {
    const currentPageElement = document.querySelectorAll('.page')[window.currentPage];
    if (!currentPageElement) return;

    const videoContainers = currentPageElement.querySelectorAll('.video-component');

    // Só tenta reiniciar se existirem vídeos na página e nenhum player estiver ativo
    if (videoContainers.length > 0 && (!window.videoPlayers || window.videoPlayers.length === 0)) {
        if (window.initializeVideoPlayers) {
            window.initializeVideoPlayers();
        }
    }
}


// -----------------------------
// SALVAR E CARREGAR PÁGINA
// -----------------------------

function loadLastPage() {
    // Recupera o número da última página salva no navegador
    const savedPage = localStorage.getItem('guiaCiencias_ultimaPagina');
    if (savedPage !== null) {
        const pageNumber = parseInt(savedPage);

        // Verifica se o número é válido
        if (pageNumber >= 0 && pageNumber < totalPages) {
            const pages = document.querySelectorAll('.page');
            pages[window.currentPage].classList.remove('active');
            window.currentPage = pageNumber;
            pages[window.currentPage].classList.add('active');
        }
    }
}

// Salva a página atual no armazenamento local (LocalStorage)
function saveCurrentPage() {
    localStorage.setItem('guiaCiencias_ultimaPagina', window.currentPage.toString());
}


// -----------------------------
// MUDANÇA DE PÁGINAS
// -----------------------------

// Vai direto para uma página específica
function goToPage(pageNumber) {
    pauseAllVideosOnCurrentPage(); // pausa os vídeos antes de mudar

    const pages = document.querySelectorAll('.page');
    pages[window.currentPage].classList.remove('active');
    window.currentPage = pageNumber;
    pages[window.currentPage].classList.add('active');

    // Atualiza tudo
    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
    updateUrlHash();

    // Garante que vídeos recarreguem corretamente
    setTimeout(reinitializeVideoPlayersIfNeeded, 300);
}

// Muda de página com base na direção (-1 = voltar, +1 = avançar)
function changePage(direction) {
    pauseAllVideosOnCurrentPage();

    const pages = document.querySelectorAll('.page');
    pages[window.currentPage].classList.remove('active');

    // Atualiza o número da página
    window.currentPage += direction;

    // Se passar do fim ou do início, volta em loop
    if (window.currentPage < 0) window.currentPage = totalPages - 1;
    if (window.currentPage >= totalPages) window.currentPage = 0;

    pages[window.currentPage].classList.add('active');

    saveCurrentPage();
    updateNavigation();
    updateProgressBar();
    updateUrlHash();

    setTimeout(reinitializeVideoPlayersIfNeeded, 300);
}

// Volta para a primeira página (início)
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


// -----------------------------
// ATUALIZAÇÃO DA INTERFACE
// -----------------------------

// Habilita/desabilita os botões “anterior” e “próximo”
function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.disabled = window.currentPage === 0;
    if (nextBtn) nextBtn.disabled = window.currentPage === totalPages - 1;
}

// Atualiza a barrinha de progresso (visual)
function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = ((window.currentPage + 1) / totalPages) * 100;
        progressBar.style.width = progress + '%';
    }
}


// -----------------------------
// SISTEMA DE HASH (URL)
// -----------------------------

// Atualiza o endereço da página (ex: #pagina03)
function updateUrlHash() {
    if (!isInitialized) return;
    const newHash = `#pagina${String(window.currentPage).padStart(2, '0')}`;
    if (window.location.hash !== newHash) {
        history.replaceState(null, null, newHash);
    }
}

// Converte o hash da URL (#pagina03) em número (3)
function hashToPageNumber(hash) {
    if (!hash || !hash.startsWith('#pagina')) return null;
    const pageStr = hash.replace('#pagina', '');
    const pageNum = parseInt(pageStr);
    return (pageNum >= 0 && pageNum < totalPages) ? pageNum : null;
}

// Quando o site abre, verifica se há um hash na URL
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

// Quando o hash muda (ex: alguém cola #pagina05 na URL)
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


// -----------------------------
// EVENTOS (TECLAS E TOQUE)
// -----------------------------

// Permite usar as setas do teclado ← e →
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && window.currentPage > 0) changePage(-1);
    if (e.key === 'ArrowRight' && window.currentPage < totalPages - 1) changePage(1);
});

// Detecta gestos de deslizar (swipe) em celulares
let startX = 0, startY = 0;
document.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

document.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = startX - endX;
    const diffY = startY - endY;

    // Só conta se o movimento for mais horizontal que vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && window.currentPage < totalPages - 1) changePage(1); // deslizar para a esquerda → próxima página
        else if (diffX < 0 && window.currentPage > 0) changePage(-1); // deslizar para a direita → página anterior
    }
});

// Quando o hash muda (por clique ou colagem de link)
window.addEventListener('hashchange', handleHashChange);

// Quando o site carrega, inicia tudo
document.addEventListener('DOMContentLoaded', initializePages);
window.addEventListener('load', () => {
    if (totalPages === 0) initializePages();
});


// -----------------------------
// FERRAMENTAS DE DEPURAÇÃO (DEBUG)
// -----------------------------

// Gera o link completo da página atual (para compartilhar)
function getShareableUrl(pageNumber) {
    const baseUrl = window.location.href.split('#')[0];
    const hash = `#pagina${String(pageNumber).padStart(2, '0')}`;
    return baseUrl + hash;
}

// Mostra informações no console (útil para testar)
function debugNavigation() {
    console.log({
        currentPage: window.currentPage,
        totalPages: totalPages,
        currentHash: window.location.hash,
        shareableUrl: getShareableUrl(window.currentPage),
        isInitialized: isInitialized
    });
}
