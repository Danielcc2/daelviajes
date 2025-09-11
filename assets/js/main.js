import './editmode.js';
import './hero.js';
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
// Normaliza enlaces relativos a absolutos respecto a la raíz del sitio
function normalizeInternalLinks(){
  // No reescribimos rutas dentro del panel admin
  if (window.location.pathname.includes('/admin/')) return;
  const base = getSiteBase();
  const anchors = document.querySelectorAll('a[href]');
  anchors.forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href) || href.startsWith('//')) return; // absoluto
    // Reescribe relativo contra la raíz del sitio
    const abs = new URL(href, base).href;
    a.setAttribute('href', abs);
  });
}
// Ejecuta tras parseo
normalizeInternalLinks();
// Menú móvil
const btnHam = document.getElementById('btnHamburguer');
const menuMovil = document.getElementById('menu-movil');
if (btnHam && menuMovil){
  btnHam.addEventListener('click', () => {
    const open = !menuMovil.hasAttribute('hidden');
    if (open){ menuMovil.setAttribute('hidden',''); btnHam.setAttribute('aria-expanded','false'); }
    else { menuMovil.removeAttribute('hidden'); btnHam.setAttribute('aria-expanded','true'); }
  });
}
// Salir
const btnSalir = document.getElementById('btnSalir');
if (btnSalir){ btnSalir.addEventListener('click', async (e)=>{ e.preventDefault(); await supabase.auth.signOut(); location.href = getSiteBase() + 'index.html'; }); }

export async function cargarUltimosArticulos(){
  const ul = document.getElementById('listUltimos'); if (!ul) return;
  const { data, error } = await supabase.from('posts').select('id,slug,titulo,resumen,categoria,portada_url,portada_y,contenido').eq('publicado', true).order('fecha_pub',{ascending:false}).limit(6);
  if (error) return console.error(error);
  ul.innerHTML = '';
  (data||[]).forEach(p => {
    const cover = p.portada_url || extraerPrimeraImagen(p.contenido); const pos = (typeof p.portada_y === 'number') ? p.portada_y : 50;
    const el = document.createElement('article'); el.className = 'tarjeta-articulo' + (cover ? ' has-bg' : '');
    el.innerHTML = `${cover ? `<div class="tarjeta-bg" style="background-image:url('${cover}');background-position:center ${pos}%"></div>` : ''}<div class="contenido-tarjeta">
      <h3><a href="post.html?slug=${p.slug}">${p.titulo}</a></h3>
      <p class="extracto">${p.resumen??''}</p><span class="categoria">${p.categoria??''}</span>
    </div>`;
    const favBtn = document.createElement('button'); favBtn.className='btn btn-secundario btn-fav'; favBtn.dataset.id=p.id; favBtn.textContent='★ Favorito';
    el.querySelector('.contenido-tarjeta').appendChild(favBtn);
    ul.appendChild(el);
  });
}

export async function buscarPosts(q = '', categoria = ''){
  const cont = document.getElementById('listBlog'); if (!cont) return;
  let query = supabase.from('posts').select('id,slug,titulo,resumen,categoria,portada_url,portada_y,contenido').eq('publicado', true);
  if (q) query = query.ilike('titulo', `%${q}%`);
  if (categoria) query = query.eq('categoria', categoria);
  const { data, error } = await query.order('fecha_pub',{ascending:false});
  if (error) return console.error(error);
  cont.innerHTML = '';
  (data||[]).forEach(p => {
    const cover = p.portada_url || extraerPrimeraImagen(p.contenido); const pos = (typeof p.portada_y === 'number') ? p.portada_y : 50;
    const el = document.createElement('article'); el.className = 'tarjeta-articulo' + (cover ? ' has-bg' : '');
    el.innerHTML = `${cover ? `<div class="tarjeta-bg" style="background-image:url('${cover}');background-position:center ${pos}%"></div>` : ''}<div class="contenido-tarjeta">
      <h3><a href="post.html?slug=${p.slug}">${p.titulo}</a></h3>
      <p class="extracto">${p.resumen??''}</p><span class="categoria">${p.categoria??''}</span>
    </div>`;
    const favBtn = document.createElement('button'); favBtn.className='btn btn-secundario btn-fav'; favBtn.dataset.id=p.id; favBtn.textContent='★ Favorito';
    el.querySelector('.contenido-tarjeta').appendChild(favBtn);
    cont.appendChild(el);
  });
}
export async function listarGuias(){ return buscarPorTipo('Guías','listGuias'); }
export async function listarResenas(){ return buscarPorTipo('Reseñas','listResenas'); }
export async function listarConsejos(){ return buscarPorTipo('Consejos','listConsejos'); }
async function buscarPorTipo(tipo, targetId){
  const cont = document.getElementById(targetId); if (!cont) return;
  const { data, error } = await supabase.from('posts').select('id,slug,titulo,resumen,categoria,portada_url,portada_y,contenido').eq('publicado', true).eq('categoria', tipo).order('fecha_pub',{ascending:false});
  if (error) return console.error(error);
  cont.innerHTML = '';
  (data||[]).forEach(p => {
    const cover = p.portada_url || extraerPrimeraImagen(p.contenido); const pos = (typeof p.portada_y === 'number') ? p.portada_y : 50;
    const el = document.createElement('article'); el.className = 'tarjeta-articulo' + (cover ? ' has-bg' : '');
    el.innerHTML = `${cover ? `<div class="tarjeta-bg" style="background-image:url('${cover}');background-position:center ${pos}%"></div>` : ''}<div class="contenido-tarjeta">
      <h3><a href="post.html?slug=${p.slug}">${p.titulo}</a></h3>
      <p class="extracto">${p.resumen??''}</p><span class="categoria">${p.categoria??''}</span>
    </div>`;
    const favBtn = document.createElement('button'); favBtn.className='btn btn-secundario btn-fav'; favBtn.dataset.id=p.id; favBtn.textContent='★ Favorito';
    el.querySelector('.contenido-tarjeta').appendChild(favBtn);
    cont.appendChild(el);
  });
}
export async function enviarContacto(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  const { error } = await supabase.from('mensajes_contacto').insert(payload);
  const msg = document.getElementById('msgContacto');
  if (error){ msg.textContent='Error al enviar.'; msg.className='msg error'; }
  else { msg.textContent='¡Mensaje enviado!'; msg.className='msg ok'; e.target.reset(); }
}
// Favoritos handler
document.addEventListener('click', async (e)=>{
  const btn = e.target.closest('.btn-fav'); if (!btn) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { alert('Inicia sesión para guardar favoritos.'); return; }
  const { error } = await supabase.from('favoritos').insert({ user_id: session.user.id, post_id: btn.dataset.id });
  if (error){ alert('No se pudo guardar (¿ya está en favoritos?).'); }
  else { btn.textContent='✓ Guardado'; btn.disabled=true; }
});

function extraerPrimeraImagen(md=''){
  const m = md && typeof md === 'string' ? md.match(/!\[[^\]]*\]\(([^)]+)\)/) : null;
  return m ? m[1] : '';
}
