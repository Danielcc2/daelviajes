import { supabase } from '../../config/supabase.js';
function getSiteBase(){
  try { const logo = document.querySelector('a.logo-link'); if (logo){ const abs=new URL(logo.getAttribute('href')||'../index.html', window.location.href); return abs.href.replace(/index\.html(?:[?#].*)?$/, ''); } } catch(_){ }
  const path = window.location.pathname; const dir = path.endsWith('/') ? path : path.replace(/[^/]*$/, ''); return new URL(dir, window.location.origin).href;
}
export async function requerirAdmin(){
  const { data: { session } } = await supabase.auth.getSession();
  if (!session){ location.href = getSiteBase() + 'index.html'; return; }
  const { data, error } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
  if (error || !data?.is_admin){ alert('Solo administradores'); location.href = getSiteBase() + 'index.html'; }
}
export async function gestionarPosts(){ await requerirAdmin();
  const form = document.getElementById('formPost');
  const tabla = document.getElementById('tablaPosts');
  const btnGuardar = document.getElementById('btnGuardarPost');
  const btnCancelarEd = document.getElementById('btnCancelarEd');
  const postIdInput = document.getElementById('postId');
  let currentSlug = '';
  // Editor avanzado (Toast UI) si está disponible
  let editor = null;
  const editorContainer = document.getElementById('mdEditor');
  try {
    if (editorContainer && window.toastui?.Editor){
      const colorSyntax = window.toastui?.Editor?.plugin?.colorSyntax || window.colorSyntax;
      editor = new window.toastui.Editor({
        el: editorContainer,
        height: '520px',
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        usageStatistics: false,
        plugins: colorSyntax ? [colorSyntax] : [],
        hooks: {
          addImageBlobHook: async (blob, callback) => {
            try{
              const safe = (blob.name||'img').replace(/[^a-zA-Z0-9_.-]+/g,'_');
              const path = `posts/${Date.now()}_${safe}`;
              const { error } = await supabase.storage.from('imagenes-posts').upload(path, blob, { cacheControl:'3600', upsert:false, contentType: blob.type||'image/*' });
              if (error) throw error;
              const { data } = supabase.storage.from('imagenes-posts').getPublicUrl(path);
              const url = data?.publicUrl; if (!url) throw new Error('No se pudo obtener URL pública');
              callback(url, safe);
              renderImagesList();
            }catch(e){ alert('No se pudo subir la imagen: '+(e.message||e)); }
          }
        }
      });
      // Exponer global para otros handlers
      window.editor = editor;
    }
  } catch(_){}
  // Uploader (mismo input para contenido y portada)
  const portadaInput = document.getElementById('imgFile');
  const btnPortada = document.getElementById('btnSubirPortada');
  const portadaMsg = document.getElementById('portadaMsg');
  const portadaUrl = document.getElementById('portadaUrl');
  const portadaPreview = document.getElementById('portadaPreview');
  const portadaFondo = document.getElementById('portadaFondo');
  const portadaPosRange = document.getElementById('portadaPos');
  const portadaPosVal = document.getElementById('portadaPosVal');
  function slugify(t=''){ return (t||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  function storagePathFromPublicUrl(url=''){ const m = url.match(/\/storage\/v1\/object\/public\/imagenes-posts\/(.*)$/); return m ? m[1] : ''; }
  function escapeRegExp(s=''){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  async function resizeAndCrop(file, w, h, mime='image/webp', quality=0.85){
    const img = await new Promise((res, rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=URL.createObjectURL(file); });
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h; const ctx = canvas.getContext('2d');
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale; const sh = h / scale;
    const sx = (img.naturalWidth - sw) / 2; const sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    const blob = await new Promise(res=>canvas.toBlob(res, mime, quality));
    return blob || file;
  }
  if (btnPortada && portadaInput){
    btnPortada.addEventListener('click', async ()=>{
      if (!portadaInput.files || portadaInput.files.length===0){ portadaMsg.textContent='Elige una imagen de portada.'; portadaMsg.className='msg error'; return; }
      const file = portadaInput.files[0];
      const blob = await resizeAndCrop(file, 1600, 900, 'image/webp', 0.9);
      const slug = currentSlug || slugify(form.titulo.value || 'post');
      const path = `covers/${slug}/cover.webp`;
      portadaMsg.textContent='Subiendo portada...';
      const { error } = await supabase.storage.from('imagenes-posts').upload(path, blob, { cacheControl:'3600', upsert:true, contentType: 'image/webp' });
      if (error){ portadaMsg.textContent='Error: '+error.message; portadaMsg.className='msg error'; return; }
      const { data } = supabase.storage.from('imagenes-posts').getPublicUrl(path);
      const url = data?.publicUrl;
      if (!url){ portadaMsg.textContent='No se pudo obtener URL.'; portadaMsg.className='msg error'; return; }
      portadaUrl.value = url;
      if (portadaPreview && portadaFondo){
        portadaPreview.style.display='block'; portadaFondo.style.backgroundImage = `url(${url})`;
        const posY = (portadaPosRange && portadaPosRange.value) ? portadaPosRange.value : 50;
        const posX = (portadaPosXRange && portadaPosXRange.value) ? portadaPosXRange.value : 50;
        portadaFondo.style.backgroundPosition = `${posX}% ${posY}%`;
      }
      portadaMsg.textContent='Portada lista.'; portadaMsg.className='msg ok';
    });
  }
  const btnQuitarPortada = document.getElementById('btnQuitarPortada');
  if (btnQuitarPortada){
    btnQuitarPortada.addEventListener('click', ()=>{
      portadaUrl.value = '';
      if (portadaPreview && portadaFondo){
        portadaFondo.style.backgroundImage = 'none';
        portadaPreview.style.display = 'none';
      }
    });
  }
  function renderImagesList(){
    const cont = document.getElementById('imgsPostList'); if (!cont) return;
    const md = editor ? editor.getMarkdown() : (form.contenido?.value||'');
    const re = /!\[[^\]]*\]\(([^)]+)\)/g; const urls = new Set(); let m;
    while ((m = re.exec(md))){ urls.add(m[1]); }
    cont.innerHTML = '';
    urls.forEach(url => {
      const wrap = document.createElement('div'); wrap.className='img-item';
      const img = document.createElement('img'); img.src=url; img.alt='';
      const btn = document.createElement('button'); btn.type='button'; btn.textContent='✕'; btn.title='Eliminar';
      btn.addEventListener('click', async ()=>{
        if (!confirm('¿Eliminar la imagen y limpiar del contenido?')) return;
        const path = storagePathFromPublicUrl(url);
        if (path){ const { error } = await supabase.storage.from('imagenes-posts').remove([path]); if (error){ alert('No se pudo eliminar: '+error.message); return; } }
        const rx = new RegExp('!\\\[[^\\\]]*\\\]\\\('+escapeRegExp(url)+'\\\)\\s*\\n?', 'g');
        const nuevo = md.replace(rx, '');
        if (editor) editor.setMarkdown(nuevo); else if (form.contenido) form.contenido.value = nuevo;
        renderImagesList();
      });
      wrap.appendChild(img); wrap.appendChild(btn); cont.appendChild(wrap);
    });
  }
  async function cargar(){ const { data } = await supabase.from('posts').select('id,titulo,categoria,publicado,fecha_pub').order('fecha_pub',{ascending:false});
    tabla.innerHTML = '<div class="tabla-row tabla-head">Título — Categoría — Publicado — Acciones</div>';
    (data||[]).forEach(p => { const row = document.createElement('div'); row.className='tabla-row';
      row.innerHTML = `${p.titulo} — ${p.categoria} — ${p.publicado ? 'Sí':'No'} <button class="btn btn-link" data-edit="${p.id}">Editar</button> <button class="btn btn-link" data-del="${p.id}">Eliminar</button>`; tabla.appendChild(row); });
    tabla.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', async ()=>{ await supabase.from('posts').delete().eq('id', b.dataset.del); cargar(); }));
    tabla.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', async ()=>{
      const { data: p } = await supabase.from('posts').select('id,titulo,resumen,contenido,categoria,portada_url,portada_y,publicado,slug').eq('id', b.dataset.edit).single();
      if (!p) return;
      if (postIdInput) postIdInput.value = p.id;
      form.titulo.value = p.titulo || '';
      form.categoria.value = p.categoria || '';
      form.resumen.value = p.resumen || '';
      form.contenido.value = p.contenido || '';
      if (editor){ editor.setMarkdown(form.contenido.value||''); }
      portadaUrl.value = p.portada_url || '';
      if (p.portada_url && portadaPreview && portadaFondo){
        portadaPreview.style.display='block'; portadaFondo.style.backgroundImage = `url(${p.portada_url})`;
        const posY = (typeof p.portada_y === 'number') ? p.portada_y : 50;
        const posX = (typeof p.portada_x === 'number') ? p.portada_x : 50;
        if (portadaPosRange) portadaPosRange.value = posY;
        if (portadaPosVal) portadaPosVal.textContent = posY+"%";
        if (portadaPosXRange) portadaPosXRange.value = posX;
        if (portadaPosXVal) portadaPosXVal.textContent = posX+"%";
        portadaFondo.style.backgroundPosition = `${posX}% ${posY}%`;
      } else if (portadaPreview){ portadaPreview.style.display='none'; }
      if (btnGuardar) btnGuardar.textContent = 'Guardar cambios';
      if (btnCancelarEd) btnCancelarEd.style.display = 'inline-block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderImagesList();
    }));
  }
  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); const fd = new FormData(form); const payload = Object.fromEntries(fd.entries());
    const editingId = postIdInput?.value || '';
    payload.contenido = editor ? editor.getMarkdown() : payload.contenido;
    if (form.contenido) form.contenido.value = payload.contenido;
    let error;
    if (editingId){
      delete payload.id;
      payload.portada_y = portadaPosRange ? parseInt(portadaPosRange.value || '50', 10) : 50;
      payload.portada_x = (typeof portadaPosXRange !== 'undefined' && portadaPosXRange) ? parseInt(portadaPosXRange.value || '50', 10) : 50;
      const res = await supabase.from('posts').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      payload.publicado = true; payload.slug = (payload.titulo||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
      payload.fecha_pub = new Date().toISOString();
      if (!payload.portada_url){ const m = (payload.contenido||'').match(/!\[[^\]]*\]\(([^)]+)\)/); if (m) payload.portada_url = m[1]; }
      payload.portada_y = portadaPosRange ? parseInt(portadaPosRange.value || '50', 10) : 50;
      payload.portada_x = (typeof portadaPosXRange !== 'undefined' && portadaPosXRange) ? parseInt(portadaPosXRange.value || '50', 10) : 50;
      const res = await supabase.from('posts').insert(payload);
      error = res.error;
    }
    const msg = document.getElementById('msgPost');
    if (error){ msg.textContent='Error al guardar'; msg.className='msg error'; }
    else { msg.textContent= editingId ? 'Cambios guardados' : 'Publicado'; msg.className='msg ok'; form.reset(); if (editor) editor.setMarkdown(''); if (postIdInput) postIdInput.value=''; portadaUrl.value=''; if (portadaPreview) portadaPreview.style.display='none'; if (btnGuardar) btnGuardar.textContent='Publicar'; if (btnCancelarEd) btnCancelarEd.style.display='none'; renderImagesList(); cargar(); }
  });
  if (btnCancelarEd){ btnCancelarEd.addEventListener('click', ()=>{ form.reset(); if (postIdInput) postIdInput.value=''; portadaUrl.value=''; if (portadaPreview) portadaPreview.style.display='none'; if (btnGuardar) btnGuardar.textContent='Publicar'; btnCancelarEd.style.display='none'; document.getElementById('msgPost').textContent=''; }); }
  cargar();
}
// Usuarios
export async function listarUsuarios(){ await requerirAdmin();
  const tabla = document.getElementById('tablaUsuarios'); const { data } = await supabase.from('profiles').select('id,email,nombre,is_admin').order('created_at',{ascending:false});
  tabla.innerHTML=''; (data||[]).forEach(u=>{ const row=document.createElement('div'); row.className='tabla-row'; row.innerHTML = `${u.email??u.id} — ${u.nombre??''} — ${u.is_admin?'admin':'usuario'}`; tabla.appendChild(row); });
}
// Markdown preview + uploader
(function(){
  const area = document.getElementById('mdContenido');
  const fileInput = document.getElementById('imgFile'); const btn = document.getElementById('btnSubirImg'); const msg = document.getElementById('imgMsg');
  async function resizeAndCrop(file, w, h, mime='image/webp', quality=0.85){
    const img = await new Promise((res, rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=URL.createObjectURL(file); });
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h; const ctx = canvas.getContext('2d');
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale; const sh = h / scale;
    const sx = (img.naturalWidth - sw) / 2; const sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    const blob = await new Promise(res=>canvas.toBlob(res, mime, quality));
    return blob || file;
  }
  if (btn && fileInput){ btn.addEventListener('click', async ()=>{
    if (!fileInput.files || fileInput.files.length===0){ msg.textContent='Elige una imagen primero.'; msg.className='msg error'; return; }
    const file = fileInput.files[0]; const { data: { session } } = await supabase.auth.getSession(); if (!session){ msg.textContent='Inicia sesión.'; msg.className='msg error'; return; }
    const blob = await resizeAndCrop(file, 1280, 720, 'image/webp', 0.85);
    const path = `posts/${Date.now()}_content.webp`; msg.textContent='Subiendo...';
    const { error } = await supabase.storage.from('imagenes-posts').upload(path, blob, { cacheControl:'3600', upsert:false, contentType: 'image/webp' });
    if (error){ msg.textContent='Error: '+error.message; msg.className='msg error'; return; }
    const { data: pub } = supabase.storage.from('imagenes-posts').getPublicUrl(path); const url = pub?.publicUrl;
    if (!url){ msg.textContent='No se pudo obtener URL pública.'; msg.className='msg error'; return; }
    // Usar como portada por defecto
    const portadaUrl = document.getElementById('portadaUrl'); const portadaPreview = document.getElementById('portadaPreview'); const portadaFondo = document.getElementById('portadaFondo');
    if (portadaUrl) portadaUrl.value = url;
    if (portadaPreview && portadaFondo){ portadaPreview.style.display='block'; portadaFondo.style.backgroundImage = `url(${url})`; }
    msg.textContent='Portada subida y seleccionada.'; msg.className='msg ok'; fileInput.value='';
  });}
})();

// Drag para ajustar posición de portada
document.addEventListener('DOMContentLoaded', ()=>{
  const fondo = document.getElementById('portadaFondo');
  const range = document.getElementById('portadaPos');
  const out = document.getElementById('portadaPosVal');
  if (!fondo || !range) return;
  fondo.style.cursor = 'grab';
  const setPos = (pct)=>{ pct = Math.min(100, Math.max(0, Math.round(pct))); range.value = pct; if (out) out.textContent = pct+"%"; fondo.style.backgroundPosition = `center ${pct}%`; };
  range.addEventListener('input', ()=> setPos(range.value));
  let dragging = false;
  const onMove = (e)=>{
    if (!dragging) return; const rect = fondo.getBoundingClientRect(); const clientY = (e.touches && e.touches[0]?.clientY) || e.clientY; const y = (clientY - rect.top) / rect.height * 100; setPos(y);
  };
  fondo.addEventListener('mousedown', (e)=>{ dragging = true; fondo.style.cursor='grabbing'; onMove(e); });
  document.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseup', ()=>{ dragging=false; fondo.style.cursor='grab'; });
  fondo.addEventListener('touchstart', (e)=>{ dragging = true; onMove(e); }, { passive: true });
  document.addEventListener('touchmove', onMove, { passive: true });
  document.addEventListener('touchend', ()=>{ dragging=false; });
});
