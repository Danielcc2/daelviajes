import { supabase } from '../../config/supabase.js';

function getSlug(){ const url = new URL(window.location.href); return url.searchParams.get('slug') || ''; }

async function cargarItinerario(){
  const slug = getSlug(); const tEl = document.getElementById('itTitulo'); if (!slug){ tEl.textContent='Itinerario no encontrado'; return; }
  const { data, error } = await supabase.from('itinerarios_publicos').select('titulo,resumen,contenido,fecha_pub').eq('slug', slug).single();
  if (error || !data){ tEl.textContent='No encontrado'; return; }
  tEl.textContent = data.titulo || '';
  const meta = document.getElementById('itMeta'); meta.textContent = data.fecha_pub ? new Date(data.fecha_pub).toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'}) : '';
  const c = document.getElementById('itContent');
  try { if (typeof marked !== 'undefined'){ c.innerHTML = marked.parse(data.contenido||''); } else { c.textContent = data.contenido||''; } } catch(e){ c.textContent = data.contenido||''; }
}

document.addEventListener('DOMContentLoaded', cargarItinerario);

