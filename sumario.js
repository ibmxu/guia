// === SUMÁRIO EXPANSÍVEL ===
function toggleUnidade(unidadeId) {
  const unidade = document.getElementById(unidadeId);
  const subtopicos = document.getElementById('subtopicos' + unidadeId.slice(-1));
  if (unidade.classList.contains('expanded')) {
    unidade.classList.remove('expanded');
    subtopicos.classList.remove('expanded');
  } else {
    document.querySelectorAll('.unidade').forEach(u => {
      if (u !== unidade) u.classList.remove('expanded');
    });
    document.querySelectorAll('.subtopicos').forEach(s => {
      if (s !== subtopicos) s.classList.remove('expanded');
    });
    unidade.classList.add('expanded');
    subtopicos.classList.add('expanded');
  }
}
