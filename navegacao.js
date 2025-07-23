// === NAVEGAÇÃO DE PÁGINAS E LOCAL STORAGE ===
let currentPage = 0;
let totalPages = 0;

function initializePages() {
  const pages = document.querySelectorAll('.page');
  totalPages = pages.length;
  loadLastPage();
  updateNavigation();
  updateProgressBar();
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
  const pages = document.querySelectorAll('.page');
  pages[currentPage].classList.remove('active');
  currentPage = pageNumber;
  pages[currentPage].classList.add('active');
  saveCurrentPage();
  updateNavigation();
  updateProgressBar();
}

function changePage(direction) {
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
  const pages = document.querySelectorAll('.page');
  pages[currentPage].classList.remove('active');
  currentPage = 0;
  pages[currentPage].classList.add('active');
  saveCurrentPage();
  updateNavigation();
  updateProgressBar();
}

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
