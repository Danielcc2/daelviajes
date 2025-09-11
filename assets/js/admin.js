import { supabase } from '../../config/supabase.js';
export async function requerirAdmin(){ const { data: { session } } = await supabase.auth.getSession(); if (!session){ location.href='../index.html'; return; }
  const { data } = await supabase.from('profiles').select('is_admin').single(); if (!data?.is_admin){ alert('Solo administradores'); location.href='../index.html'; } }
export async function gestionarPosts(){ await requerirAdmin();
  const form = document.getElementById('formPost'); const tabla = document.getElementById('tablaPosts');
  async function cargar(){ const { data } = await supabase.from('posts').select('id,titulo,categoria,publicado,fecha_pub').order('fecha_pub',{ascending:false});
    tabla.innerHTML = '<div class="tabla-row tabla-head">Título — Categoría — Publicado</div>';
    (data||[]).forEach(p => { const row = document.createElement('div'); row.className='tabla-row';
      row.innerHTML = `${p.titulo} — ${p.categoria} — ${p.publicado ? 'Sí':'No'} <button class="btn btn-link" data-del="${p.id}">Eliminar</button>`; tabla.appendChild(row); });
    tabla.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', async ()=>{ await supabase.from('posts').delete().eq('id', b.dataset.del); cargar(); }));
  }
  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); const fd = new FormData(form); const payload = Object.fromEntries(fd.entries());
    payload.publicado = true; payload.slug = (payload.titulo||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    payload.fecha_pub = new Date().toISOString();
    const { error } = await supabase.from('posts').insert(payload);
    const msg = document.getElementById('msgPost');
    if (error){ msg.textContent='Error al publicar'; msg.className='msg error'; } else { msg.textContent='Publicado'; msg.className='msg ok'; form.reset(); cargar(); }
  });
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