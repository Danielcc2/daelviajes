import { supabase } from '../../config/supabase.js';
function getSiteBase(){
  try {
    const logo = document.querySelector('a.logo-link');
    if (logo){ const abs = new URL(logo.getAttribute('href')||'index.html', window.location.href); return abs.href.replace(/index\.html(?:[?#].*)?$/, ''); }
  } catch(_) {}
  const path = window.location.pathname;
  const dir = path.endsWith('/') ? path : path.replace(/[^/]*$/, '');
  return new URL(dir, window.location.origin).href;
}
const tabLogin = document.getElementById('tabLogin'); const tabReg = document.getElementById('tabReg');
const formLogin = document.getElementById('formLogin'); const formRegistro = document.getElementById('formRegistro');
if (tabLogin && tabReg && formLogin && formRegistro){
  tabLogin.addEventListener('click', ()=>{ tabLogin.classList.add('activo'); tabReg.classList.remove('activo'); formLogin.classList.remove('oculto'); formRegistro.classList.add('oculto'); });
  tabReg.addEventListener('click', ()=>{ tabReg.classList.add('activo'); tabLogin.classList.remove('activo'); formRegistro.classList.remove('oculto'); formLogin.classList.add('oculto'); });
}
if (formLogin){ formLogin.addEventListener('submit', async (e)=>{
  e.preventDefault(); const email = e.target.email.value; const password = e.target.password.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  const msg = document.getElementById('msgLogin');
  if (error){ msg.textContent = error.message; msg.className='msg error'; }
  else { msg.textContent = '¡Bienvenido!'; msg.className='msg ok'; location.reload(); }
});}
if (formRegistro){ formRegistro.addEventListener('submit', async (e)=>{
  e.preventDefault(); const email = e.target.email.value; const password = e.target.password.value;
  const { error } = await supabase.auth.signUp({ email, password });
  const msg = document.getElementById('msgRegistro');
  if (error){ msg.textContent = error.message; msg.className='msg error'; }
  else { msg.textContent = 'Revisa tu email para confirmar la cuenta.'; msg.className='msg ok'; }
});}
(async () => {
  const { data } = await supabase.auth.getSession();
  const navCuenta = document.getElementById('navCuenta');
  const menuMovilCuenta = document.getElementById('menu-movil-cuenta');
  
  const updateAuthUI = (isLoggedIn, user) => {
    const siteBase = getSiteBase();
    
    // Actualizar nav principal
    if (navCuenta) {
      if (isLoggedIn) {
        navCuenta.textContent = user.email.split('@')[0];
        navCuenta.href = siteBase + 'usuario/perfil.html';
        const reg = document.getElementById('navRegistro');
        if (reg) reg.remove();
      } else {
        navCuenta.textContent = 'Iniciar sesión';
        navCuenta.href = siteBase + 'usuario/login.html';
        const li = navCuenta.closest('li');
        if (li && !document.getElementById('navRegistro')) {
          const regLi = document.createElement('li');
          const a = document.createElement('a');
          a.id = 'navRegistro';
          a.href = siteBase + 'usuario/registro.html';
          a.textContent = 'Crear cuenta';
          regLi.appendChild(a);
          li.parentElement?.insertBefore(regLi, li.nextSibling);
        }
      }
    }
    
    // Actualizar menú móvil
    if (menuMovilCuenta) {
      menuMovilCuenta.innerHTML = isLoggedIn ? `
        <a href="${siteBase}usuario/perfil.html">
          <span class="material-icons">account_circle</span>
          ${user.email.split('@')[0]}
        </a>
        <a href="${siteBase}usuario/mis-itinerarios.html">
          <span class="material-icons">map</span>
          Mis itinerarios
        </a>` : `
        <a href="${siteBase}usuario/login.html">
          <span class="material-icons">login</span>
          Iniciar sesión
        </a>
        <a href="${siteBase}usuario/registro.html">
          <span class="material-icons">person_add</span>
          Crear cuenta
        </a>`;
    }
  };
  
  updateAuthUI(!!data?.session, data?.session?.user);
    }
  }
})();
const btnRec = document.getElementById('btnRecuperar');
if (btnRec){
  btnRec.addEventListener('click', async () => {
    const email = (document.getElementById('loginEmail') || {}).value;
    if (!email) return alert('Escribe tu email.');
    const redirectTo = getSiteBase() + 'usuario/perfil.html';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) alert(error.message); else alert('Te enviamos un enlace para restablecer.');
  });
}
