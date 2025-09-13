// Este script carga el header y el footer en cada página automáticamente
function includeHTML(selector, url) {
  fetch(url)
    .then(res => res.text())
    .then(html => {
      document.querySelector(selector).innerHTML = html;
    });
}

// Espera a que el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  // Crea los contenedores si no existen
  if (!document.querySelector('main')) {
    const main = document.createElement('main');
    document.body.appendChild(main);
  }
  if (!document.getElementById('header-container')) {
    const header = document.createElement('div');
    header.id = 'header-container';
    document.body.insertBefore(header, document.body.firstChild);
  }
  if (!document.getElementById('footer-container')) {
    const footer = document.createElement('div');
    footer.id = 'footer-container';
    document.body.appendChild(footer);
  }
  includeHTML('#header-container', 'assets/html/header.html');
  includeHTML('#footer-container', 'assets/html/footer.html');
});
