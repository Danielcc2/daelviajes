import { supabase } from '../../config/supabase.js';
async function requerirAdmin(){ const { data: { session } } = await supabase.auth.getSession(); if (!session){ location.href='../index.html'; throw new Error('no session'); }
  const { data, error } = await supabase.from('profiles').select('is_admin').single(); if (error || !data?.is_admin){ alert('Solo administradores.'); location.href='../index.html'; throw new Error('no admin'); } }
let pagina = 1; const LIMITE = 50;
function render(items){
  const tabla = document.getElementById('mediaTabla'); if (pagina===1) tabla.innerHTML = '<div class="tabla-row tabla-head">Nombre — Tamaño — Modificación — Acciones</div>';
  items.forEach(item => { const row = document.createElement('div'); row.className='tabla-row';
    const size = item.metadata?.size ?? '-'; const updated = item.updated_at ? new Date(item.updated_at).toLocaleString('es-ES') : '';
    const path = (item.id?.path || item.name);
    row.innerHTML = `${path} — ${size} — ${updated} <button class="btn btn-link" data-copy="${path}">Copiar URL</button> <button class="btn btn-link" data-del="${path}">Eliminar</button>`; tabla.appendChild(row); });
  tabla.querySelectorAll('[data-copy]').forEach(b => b.onclick = async ()=>{ const { data } = supabase.storage.from('imagenes-posts').getPublicUrl(b.dataset.copy); const url = data?.publicUrl; if (url){ await navigator.clipboard.writeText(url); alert('URL copiada.'); } });
  tabla.querySelectorAll('[data-del]').forEach(b => b.onclick = async ()=>{ if (!confirm('¿Eliminar definitivamente?')) return; const { error } = await supabase.storage.from('imagenes-posts').remove([b.dataset.del]); if (error) alert('No se pudo eliminar: '+error.message); else { alert('Eliminado.'); listar(true); } });
}
async function listar(reset=false){
  await requerirAdmin(); const path = document.getElementById('path').value || '';
  if (reset){ pagina=1; document.getElementById('mediaTabla').innerHTML=''; }
  const { data, error } = await supabase.storage.from('imagenes-posts').list(path, { limit: LIMITE, offset: (pagina-1)*LIMITE, sortBy: { column:'updated_at', order:'desc' } });
  if (error){ alert(error.message); return; }
  const files = (data||[]).filter(x => x.id || x.metadata);
  render(files); pagina += 1;
}
async function crearCarpeta(){
  await requerirAdmin(); const path = document.getElementById('path').value || '';
  const tmp = `${path.replace(/\/$/,'')}/.keep_${Date.now()}`; const { error } = await supabase.storage.from('imagenes-posts').upload(tmp, new Blob(['keep'],{type:'text/plain'}), { upsert:false });
  if (error){ alert('No se pudo crear: '+error.message); return; } await supabase.storage.from('imagenes-posts').remove([tmp]); alert('Carpeta creada.'); listar(true);
}
document.getElementById('btnListar').addEventListener('click', ()=>listar(true));
document.getElementById('btnMas').addEventListener('click', ()=>listar(false));
document.getElementById('btnCrearCarp').addEventListener('click', crearCarpeta);
listar(true);
