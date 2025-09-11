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

function buildHeroHtml(){
  const base = getSiteBase();
  return `
  <header class="page-header-overlay has-wave-divider">
    <div class="hero-bg"></div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1>Explora el mundo a tu manera</h1>
      <p class="subtitle"><em>Tu próxima aventura empieza hoy.</em></p>
      <p class="description">Guías, itinerarios y reseñas honestas para viajar mejor.</p>
      <div class="hero-actions">
        <a class="btn-hero btn-hero-primary" href="${base}itinerarios.html">Planifica tu viaje</a>
        <a class="btn-hero btn-hero-secondary" href="${base}destinos.html">Explorar destinos</a>
      </div>
    </div>
    <div class="wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none">
        <path fill="currentColor" d="M0,64 C240,160 480,0 720,64 C960,128 1200,96 1440,32 L1440,160 L0,160 Z"></path>
      </svg>
    </div>
  </header>`;
}

function ensureHero(){
  if (document.querySelector('.page-header-overlay')) return document.querySelector('.page-header-overlay');
  const header = document.querySelector('.header-principal');
  if (!header) return null;
  header.insertAdjacentHTML('afterend', buildHeroHtml());
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
  const hero = ensureHero();
  if (!hero) return;
  const bg = hero.querySelector('.hero-bg');
  let bgUrl = '';
  if (window.location.pathname.endsWith('/post.html') || window.location.pathname.endsWith('post.html')){
    bgUrl = await getPostCoverFromSlug();
  }
  bg.style.backgroundImage = `url('${bgUrl || defaultHeroImage()}')`;
}

document.addEventListener('DOMContentLoaded', initHero);

