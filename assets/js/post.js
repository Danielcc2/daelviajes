import { supabase } from '../../config/supabase.js';
function getSlug(){ const url = new URL(window.location.href); return url.searchParams.get('slug') || (url.hash ? url.hash.slice(1) : ''); }
async function cargarPost(){
  const slug = getSlug(); if (!slug){ document.getElementById('postTitulo').textContent='Artículo no encontrado'; return; }
  let { data: post, error } = await supabase.from('posts').select('id,slug,titulo,resumen,contenido,categoria,fecha_pub,portada_url').eq('slug', slug).eq('publicado', true).single();
  if (error){ const res = await supabase.from('posts').select('id,slug,titulo,resumen,contenido,categoria,fecha_pub').eq('slug', slug).single(); post = res.data; }
  if (!post){ document.getElementById('postTitulo').textContent='No encontrado'; return; }
  document.getElementById('postTitulo').textContent = post.titulo;
  document.getElementById('postCategoria').textContent = post.categoria || '';
  const fecha = post.fecha_pub ? new Date(post.fecha_pub).toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'}) : '';
  document.getElementById('postMeta').textContent = fecha ? `Publicado el ${fecha}` : '';
  const c = document.getElementById('postContent');
  try { if (typeof marked !== 'undefined'){ c.innerHTML = marked.parse(post.contenido||''); } else { c.textContent = post.contenido||''; } } catch(e){ c.textContent = post.contenido||''; }
  const btnFav = document.getElementById('btnFavDetalle'); btnFav.dataset.id = post.id;
  cargarComentarios(post.id); prepararFormulario(post.id);
}
async function cargarComentarios(postId){
  const cont = document.getElementById('commentsList'); cont.textContent='Cargando…';
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.from('comentarios').select('id,texto,created_at,user_id').eq('post_id', postId).order('created_at',{ascending:false});
  if (error){ cont.textContent='No se pudieron cargar comentarios.'; return; }
  cont.innerHTML=''; (data||[]).forEach(cm=>{ const el = document.createElement('div'); el.className='comentario';
    const autor = (session && cm.user_id === session.user.id) ? 'Tú' : 'Usuario'; const fecha = new Date(cm.created_at).toLocaleString('es-ES');
    el.innerHTML = `<p class=\"link-sutil\">${autor} — ${fecha}</p><p>${escapeHtml(cm.texto)}</p>`; cont.appendChild(el); });
  if (!data || data.length===0){ const p=document.createElement('p'); p.className='link-sutil'; p.textContent='Sé el primero en comentar.'; cont.appendChild(p); }
}
function prepararFormulario(postId){
  const form = document.getElementById('formComentario'); const msg = document.getElementById('msgCom');
  form.addEventListener('submit', async (e)=>{ e.preventDefault(); const { data: { session } } = await supabase.auth.getSession();
    if (!session){ msg.textContent='Inicia sesión para comentar.'; msg.className='msg error'; return; }
    const texto = new FormData(form).get('texto'); const payload = { post_id: postId, user_id: session.user.id, texto };
    const { error } = await supabase.from('comentarios').insert(payload);
    if (error){ msg.textContent='No se pudo publicar.'; msg.className='msg error'; } else { msg.textContent='Publicado.'; msg.className='msg ok'; form.reset(); cargarComentarios(postId); }
  });
}
function escapeHtml(str=''){ return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
document.addEventListener('DOMContentLoaded', cargarPost);

function extraerPrimeraImagen(md=''){
  const m = md && typeof md === 'string' ? md.match(/!\[[^\]]*\]\(([^)]+)\)/) : null;
  return m ? m[1] : '';
}
