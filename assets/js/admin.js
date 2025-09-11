import { supabase } from '../../config/supabase.js';
export async function requerirAdmin(){
  const { data: { session } } = await supabase.auth.getSession();
  if (!session){ location.href='../index.html'; return; }
  const { data, error } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
  if (error || !data?.is_admin){ alert('Solo administradores'); location.href='../index.html'; }
}
export async function gestionarPosts(){ await requerirAdmin();
  const form = document.getElementById('formPost');
  const tabla = document.getElementById('tablaPosts');
  const btnGuardar = document.getElementById('btnGuardarPost');
  const btnCancelarEd = document.getElementById('btnCancelarEd');
  const postIdInput = document.getElementById('postId');
  // Uploader de portada
  const portadaInput = document.getElementById('imgPortada');
  const btnPortada = document.getElementById('btnSubirPortada');
  const portadaMsg = document.getElementById('portadaMsg');
  const portadaUrl = document.getElementById('portadaUrl');
  const portadaPreview = document.getElementById('portadaPreview');
  const portadaFondo = document.getElementById('portadaFondo');
  if (btnPortada && portadaInput){
    btnPortada.addEventListener('click', async ()=>{
      if (!portadaInput.files || portadaInput.files.length===0){ portadaMsg.textContent='Elige una imagen de portada.'; portadaMsg.className='msg error'; return; }
      const file = portadaInput.files[0];
      const safe = file.name.replace(/[^a-zA-Z0-9_.-]+/g,'_');
      const path = `covers/${Date.now()}_${safe}`;
      portadaMsg.textContent='Subiendo portada...';
      const { error } = await supabase.storage.from('imagenes-posts').upload(path, file, { cacheControl:'3600', upsert:false, contentType: file.type || 'image/*' });
      if (error){ portadaMsg.textContent='Error: '+error.message; portadaMsg.className='msg error'; return; }
      const { data } = supabase.storage.from('imagenes-posts').getPublicUrl(path);
      const url = data?.publicUrl;
      if (!url){ portadaMsg.textContent='No se pudo obtener URL.'; portadaMsg.className='msg error'; return; }
      portadaUrl.value = url;
      if (portadaPreview && portadaFondo){ portadaPreview.style.display='block'; portadaFondo.style.backgroundImage = `url(${url})`; }
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
  async function cargar(){ const { data } = await supabase.from('posts').select('id,titulo,categoria,publicado,fecha_pub').order('fecha_pub',{ascending:false});
    tabla.innerHTML = '<div class="tabla-row tabla-head">Título — Categoría — Publicado — Acciones</div>';
    (data||[]).forEach(p => { const row = document.createElement('div'); row.className='tabla-row';
      row.innerHTML = `${p.titulo} — ${p.categoria} — ${p.publicado ? 'Sí':'No'} <button class="btn btn-link" data-edit="${p.id}">Editar</button> <button class="btn btn-link" data-del="${p.id}">Eliminar</button>`; tabla.appendChild(row); });
    tabla.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', async ()=>{ await supabase.from('posts').delete().eq('id', b.dataset.del); cargar(); }));
    tabla.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', async ()=>{
      const { data: p } = await supabase.from('posts').select('id,titulo,resumen,contenido,categoria,portada_url,publicado,slug').eq('id', b.dataset.edit).single();
      if (!p) return;
      if (postIdInput) postIdInput.value = p.id;
      form.titulo.value = p.titulo || '';
      form.categoria.value = p.categoria || '';
      form.resumen.value = p.resumen || '';
      form.contenido.value = p.contenido || '';
      if (typeof marked !== 'undefined'){ document.getElementById('mdOut').innerHTML = marked.parse(form.contenido.value); }
      portadaUrl.value = p.portada_url || '';
      if (p.portada_url && portadaPreview && portadaFondo){ portadaPreview.style.display='block'; portadaFondo.style.backgroundImage = `url(${p.portada_url})`; } else if (portadaPreview){ portadaPreview.style.display='none'; }
      if (btnGuardar) btnGuardar.textContent = 'Guardar cambios';
      if (btnCancelarEd) btnCancelarEd.style.display = 'inline-block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }
  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); const fd = new FormData(form); const payload = Object.fromEntries(fd.entries());
    const editingId = postIdInput?.value || '';
    let error;
    if (editingId){
      delete payload.id;
      const res = await supabase.from('posts').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      payload.publicado = true; payload.slug = (payload.titulo||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
      payload.fecha_pub = new Date().toISOString();
      if (!payload.portada_url){ const m = (payload.contenido||'').match(/!\[[^\]]*\]\(([^)]+)\)/); if (m) payload.portada_url = m[1]; }
      const res = await supabase.from('posts').insert(payload);
      error = res.error;
    }
    const msg = document.getElementById('msgPost');
    if (error){ msg.textContent='Error al guardar'; msg.className='msg error'; }
    else { msg.textContent= editingId ? 'Cambios guardados' : 'Publicado'; msg.className='msg ok'; form.reset(); if (postIdInput) postIdInput.value=''; portadaUrl.value=''; if (portadaPreview) portadaPreview.style.display='none'; if (btnGuardar) btnGuardar.textContent='Publicar'; if (btnCancelarEd) btnCancelarEd.style.display='none'; cargar(); }
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
  const area = document.getElementById('mdContenido'); const out = document.getElementById('mdOut');
  if (area && out && typeof marked !== 'undefined'){ const render=()=>{ out.innerHTML = marked.parse(area.value||''); }; area.addEventListener('input', render); render(); }
  const fileInput = document.getElementById('imgFile'); const btn = document.getElementById('btnSubirImg'); const msg = document.getElementById('imgMsg');
  if (btn && fileInput){ btn.addEventListener('click', async ()=>{
    if (!fileInput.files || fileInput.files.length===0){ msg.textContent='Elige una imagen primero.'; msg.className='msg error'; return; }
    const file = fileInput.files[0]; const { data: { session } } = await supabase.auth.getSession(); if (!session){ msg.textContent='Inicia sesión.'; msg.className='msg error'; return; }
    const path = `posts/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]+/g,'_')}`; msg.textContent='Subiendo...';
    const { error } = await supabase.storage.from('imagenes-posts').upload(path, file, { cacheControl:'3600', upsert:false, contentType: file.type || 'image/*' });
    if (error){ msg.textContent='Error: '+error.message; msg.className='msg error'; return; }
    const { data: pub } = supabase.storage.from('imagenes-posts').getPublicUrl(path); const url = pub?.publicUrl;
    if (!url){ msg.textContent='No se pudo obtener URL pública.'; msg.className='msg error'; return; }
    if (area){ area.value += `\n\n![imagen](${url})\n\n`; if (typeof marked!=='undefined') out.innerHTML = marked.parse(area.value); }
    msg.textContent='Imagen subida y añadida.'; msg.className='msg ok'; fileInput.value='';
  });}
})();
