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

function defaultHeroImage(){
  return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80';
}

function buildHeroHtml({ includeCtas = false, title, subtitle, description } = {}){
  const base = getSiteBase();
  const actions = includeCtas ? `\n      <div class="hero-actions">\n        <a class="btn-hero btn-hero-primary" href="${base}itinerarios.html">Planifica tu viaje</a>\n        <a class="btn-hero btn-hero-secondary" href="${base}destinos.html">Explorar destinos</a>\n      </div>` : '';
  return `
  <header class="page-header-overlay has-wave-divider">
    <div class="hero-bg"></div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1>${title || 'Explora el mundo a tu manera'}</h1>
      <p class="subtitle"><em>${subtitle || 'Tu próxima aventura empieza hoy.'}</em></p>
      <p class="description">${description || 'Guías, itinerarios y reseñas honestas para viajar mejor.'}</p>${actions}
    </div>
    <div class="wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none">
        <path fill="currentColor" d="M0,64 C240,160 480,0 720,64 C960,128 1200,96 1440,32 L1440,160 L0,160 Z"></path>
      </svg>
    </div>
  </header>`;
}

function ensureHero(opts){
  if (document.querySelector('.page-header-overlay')) return document.querySelector('.page-header-overlay');
  const header = document.querySelector('.header-principal');
  if (!header) return null;
  header.insertAdjacentHTML('afterend', buildHeroHtml(opts));
  return document.querySelector('.page-header-overlay');
}

async function getPostCoverFromSlug(){
  const url = new URL(window.location.href);
  const slug = url.searchParams.get('slug');
  if (!slug) return '';
  try {
    let { data: post, error } = await supabase.from('posts').select('portada_url, contenido, publicado').eq('slug', slug).eq('publicado', true).single();
    if (error && !post){ const res = await supabase.from('posts').select('portada_url, contenido').eq('slug', slug).single(); post = res.data; }
    const md = post?.contenido || '';
    const m = md && typeof md === 'string' ? md.match(/!\[[^\]]*\]\(([^)]+)\)/) : null;
    return post?.portada_url || (m ? m[1] : '');
  } catch(_) { return ''; }
}

async function initHero(){
  // Evita admin
  if (window.location.pathname.includes('/admin/')) return;
  const isIndex = /\/?index\.html?$/.test(window.location.pathname);
  const isPost = window.location.pathname.endsWith('/post.html') || window.location.pathname.endsWith('post.html');
  const hero = ensureHero({ includeCtas: isIndex });
  if (!hero) return;
  const bg = hero.querySelector('.hero-bg');
  let bgUrl = '';
  if (isPost){ bgUrl = await getPostCoverFromSlug(); }
  bg.style.backgroundImage = `url('${bgUrl || defaultHeroImage()}')`;
  // Contenido dinámico para entradas: título, categoría/fecha y resumen; sin CTAs
  if (isPost){
    try{
      const url = new URL(window.location.href); const slug = url.searchParams.get('slug');
      if (slug){
        let { data: post, error } = await supabase.from('posts').select('titulo,resumen,categoria,fecha_pub,publicado').eq('slug', slug).eq('publicado', true).single();
        if (error && !post){ const res = await supabase.from('posts').select('titulo,resumen,categoria,fecha_pub').eq('slug', slug).single(); post = res.data; }
        if (post){
          const h1 = hero.querySelector('.hero-content h1'); const sub = hero.querySelector('.hero-content .subtitle'); const desc = hero.querySelector('.hero-content .description');
          if (h1) h1.textContent = post.titulo || '';
          const fecha = post.fecha_pub ? new Date(post.fecha_pub).toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'}) : '';
          if (sub) sub.innerHTML = `<em>${post.categoria || ''}${fecha ? ' — '+fecha : ''}</em>`;
          if (desc) desc.textContent = post.resumen || '';
          const actions = hero.querySelector('.hero-actions'); if (actions) actions.remove();
        }
      }
    }catch(_){ }
  } else if (!isIndex){
    const actions = hero.querySelector('.hero-actions'); if (actions) actions.remove();
  }
}

document.addEventListener('DOMContentLoaded', initHero);
