import { supabase } from '../../config/supabase.js';
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
  if (navCuenta){
    if (data?.session){
      navCuenta.textContent = data.session.user.email.split('@')[0];
      navCuenta.href = 'usuario/perfil.html';
      // Si existe un enlace de registro añadido dinámicamente, lo ocultamos
      const reg = document.getElementById('navRegistro'); if (reg) reg.remove();
    } else {
      navCuenta.textContent = 'Iniciar sesión';
      navCuenta.href = 'usuario/login.html';
      // Añadir enlace de registro junto al botón de cuenta
      const li = navCuenta.closest('li');
      if (li && !document.getElementById('navRegistro')){
        const regLi = document.createElement('li');
        const a = document.createElement('a'); a.id = 'navRegistro'; a.href = 'usuario/registro.html'; a.textContent = 'Crear cuenta';
        regLi.appendChild(a);
        li.parentElement?.insertBefore(regLi, li.nextSibling);
      }
    }
  }
})();
const btnRec = document.getElementById('btnRecuperar');
if (btnRec){
  btnRec.addEventListener('click', async () => {
    const email = (document.getElementById('loginEmail') || {}).value;
    if (!email) return alert('Escribe tu email.');
    const redirectTo = new URL('usuario/perfil.html', window.location.href).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) alert(error.message); else alert('Te enviamos un enlace para restablecer.');
  });
}
