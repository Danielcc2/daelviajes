import { supabase } from '../../config/supabase.js';
import { requerirAdmin } from './admin.js';

function slugify(t=''){ return (t||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

export async function gestionarItinsPublicos(){
  await requerirAdmin();
  const form = document.getElementById('formItinPub');
  const tabla = document.getElementById('tablaItins');
  const idInput = document.getElementById('itinId');
  const tInput = document.getElementById('itTitulo');
  const sInput = document.getElementById('itSlug');
  const rInput = document.getElementById('itResumen');
  const cArea = document.getElementById('itContenido');
  const msg = document.getElementById('msgItinPub');

  // Editor Toast UI
  let editor = null;
  try{
    if (window.toastui?.Editor){
      editor = new window.toastui.Editor({ el: document.getElementById('itEditor'), height:'520px', initialEditType:'wysiwyg', previewStyle:'vertical', usageStatistics:false, hooks: {
        addImageBlobHook: async (blob, callback) => {
          try{ const safe=(blob.name||'img').replace(/[^a-zA-Z0-9_.-]+/g,'_'); const path=`posts/${Date.now()}_${safe}`; const { error } = await supabase.storage.from('imagenes-posts').upload(path, blob, { cacheControl:'3600', upsert:false, contentType: blob.type||'image/*' }); if (error) throw error; const { data } = supabase.storage.from('imagenes-posts').getPublicUrl(path); const url=data?.publicUrl; if(!url) throw new Error('No se pudo obtener URL pública'); callback(url, safe); }catch(e){ alert('No se pudo subir la imagen: '+(e.message||e)); }
        }
      }});
    }
  }catch(_){ }

  async function cargar(){
    const { data } = await supabase.from('itinerarios_publicos').select('id,slug,titulo,resumen,fecha_pub').order('fecha_pub',{ascending:false});
    tabla.innerHTML = '<div class="tabla-row tabla-head">Título — Slug — Fecha — Acciones</div>';
    (data||[]).forEach(row => { const el=document.createElement('div'); el.className='tabla-row'; el.innerHTML=`${row.titulo} — ${row.slug} — ${row.fecha_pub ? new Date(row.fecha_pub).toLocaleDateString('es-ES'):''} <button class=\"btn btn-link\" data-edit=\"${row.id}\">Editar</button> <button class=\"btn btn-link\" data-del=\"${row.id}\">Eliminar</button>`; tabla.appendChild(el); });
    tabla.querySelectorAll('[data-del]').forEach(b=>b.onclick= async ()=>{ if(!confirm('¿Eliminar definitivamente?')) return; await supabase.from('itinerarios_publicos').delete().eq('id', b.dataset.del); cargar(); });
    tabla.querySelectorAll('[data-edit]').forEach(b=>b.onclick= async ()=>{ const { data:p } = await supabase.from('itinerarios_publicos').select('id,slug,titulo,resumen,contenido').eq('id', b.dataset.edit).single(); if(!p) return; idInput.value=p.id; tInput.value=p.titulo||''; sInput.value=p.slug||''; rInput.value=p.resumen||''; if (editor) editor.setMarkdown(p.contenido||''); document.getElementById('btnGuardar').textContent='Guardar cambios'; document.getElementById('btnCancelarEd').style.display='inline-block'; window.scrollTo({top:0,behavior:'smooth'}); });
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); const editingId = idInput.value||''; const payload = { titulo: tInput.value, slug: (sInput.value||slugify(tInput.value||'')), resumen: rInput.value, contenido: editor ? editor.getMarkdown() : (cArea?.value||'') };
    let error; if (editingId){ const res = await supabase.from('itinerarios_publicos').update(payload).eq('id', editingId); error=res.error; } else { payload.fecha_pub = new Date().toISOString(); const res = await supabase.from('itinerarios_publicos').insert(payload); error=res.error; }
    if (error){ msg.textContent='Error al guardar'; msg.className='msg error'; }
    else { msg.textContent= editingId ? 'Cambios guardados' : 'Publicado'; msg.className='msg ok'; idInput.value=''; tInput.value=''; sInput.value=''; rInput.value=''; if (editor) editor.setMarkdown(''); document.getElementById('btnGuardar').textContent='Publicar'; document.getElementById('btnCancelarEd').style.display='none'; cargar(); }
  });
  document.getElementById('btnCancelarEd').addEventListener('click', ()=>{ idInput.value=''; tInput.value=''; sInput.value=''; rInput.value=''; if (editor) editor.setMarkdown(''); document.getElementById('btnGuardar').textContent='Publicar'; document.getElementById('btnCancelarEd').style.display='none'; msg.textContent=''; });

  cargar();
}

