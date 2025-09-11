(function(){
  const KEY = 'cookieConsent';
  try { const consent = JSON.parse(localStorage.getItem(KEY) || 'null'); if (consent) return; } catch(e){}
  const bar = document.createElement('div'); bar.className = 'cookie-banner';
  bar.innerHTML = `<div class="cookie-wrap contenedor"><p>Usamos cookies técnicas y de autenticación. Más info en la <a href="cookies.html">Política de Cookies</a>.</p>
  <div class="cookie-actions"><button id="ckCfg" class="btn btn-secundario">Configurar</button><button id="ckOk" class="btn btn-primario">Aceptar</button></div></div>`;
  document.body.appendChild(bar);
  document.getElementById('ckOk').onclick = () => { localStorage.setItem(KEY, JSON.stringify({ necessary: true, analytics: false, ts: Date.now() })); bar.remove(); };
  document.getElementById('ckCfg').onclick = () => { window.location.href = 'cookies.html'; };
})();