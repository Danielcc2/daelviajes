import { supabase } from '../../config/supabase.js';
function getSiteBase(){
  try {
    const logo = document.querySelector('a.logo-link');
    if (logo){ const abs = new URL(logo.getAttribute('href')||'../index.html', window.location.href); return abs.href.replace(/index\.html(?:[?#].*)?$/, ''); }
  } catch(_) {}
  const path = window.location.pathname;
  const dir = path.endsWith('/') ? path : path.replace(/[^/]*$/, '');
  return new URL(dir, window.location.origin).href;
}
export async function inicializarPerfil(){
  const { data: { session } } = await supabase.auth.getSession(); if (!session){ location.href = getSiteBase() + 'usuario/login.html'; return; }
  // Formulario de perfil: nombre y avatar
  const formPerfil = document.getElementById('formPerfil');
  const msgPerfil = document.getElementById('msgPerfil');
  if (formPerfil){
    const { data: me } = await supabase.from('profiles').select('nombre, avatar_url, is_admin').single();
    if (me?.nombre) formPerfil.nombre.value = me.nombre;
    formPerfil.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const nombre = formPerfil.nombre.value || null;
      let avatar_url = me?.avatar_url || null;
      const file = formPerfil.avatar?.files?.[0];
      try{
        if (file){
          const safe = file.name.replace(/[^a-zA-Z0-9_.-]+/g,'_');
          const path = `avatars/${session.user.id}/${Date.now()}_${safe}`;
          const up = await supabase.storage.from('avatars').upload(path, file, { upsert:false, cacheControl:'3600', contentType: file.type || 'image/*' });
          if (up.error) throw up.error;
          const pub = supabase.storage.from('avatars').getPublicUrl(path);
          avatar_url = pub?.data?.publicUrl || avatar_url;
        }
        const upd = await supabase.from('profiles').update({ nombre, avatar_url }).eq('id', session.user.id);
        if (upd.error) throw upd.error;
        if (msgPerfil){ msgPerfil.textContent='Perfil actualizado.'; msgPerfil.className='msg ok'; }
      } catch(err){ if (msgPerfil){ msgPerfil.textContent='No se pudo actualizar: '+(err?.message||''); msgPerfil.className='msg error'; } }
    });
    // Mostrar acceso al panel admin si corresponde
    if (me?.is_admin){
      try{
        const main = document.querySelector('main.contenedor') || document.querySelector('main');
        if (main && !document.getElementById('adminPanelLink')){
          const sec = document.createElement('section'); sec.className='panel'; sec.id='adminPanelLink';
          sec.innerHTML = `<h2>Panel de administrador</h2><p><a class="btn btn-secundario" href="../admin/admin-dashboard.html">Ir al panel</a></p>`;
          main.appendChild(sec);
        }
      } catch(_){ }
    }
  }
  const favCont = document.getElementById('misFavoritos');
  if (favCont){
    const { data } = await supabase.from('favoritos_view').select('slug,titulo,resumen,categoria,portada_url,portada_y').order('created_at',{ascending:false});
    favCont.innerHTML='';
    (data||[]).forEach(async p=>{
      let cover = p.portada_url || ''; let pos = (typeof p.portada_y === 'number') ? p.portada_y : 50;
      const el=document.createElement('article'); el.className='tarjeta-articulo' + (cover ? ' has-bg' : '');
      el.innerHTML = `${cover ? `<div class=\"tarjeta-bg\" style=\"background-image:url('${cover}');background-position:center ${pos}%\"></div>` : ''}<div class=\"contenido-tarjeta\"><h3><a href=\"../post.html?slug=${p.slug}\">${p.titulo}</a></h3><p class=\"extracto\">${p.resumen??''}</p><span class=\"categoria\">${p.categoria??''}</span></div>`;
      favCont.appendChild(el);
      // Fallback cliente: si no hay portada, intenta extraer primera imagen del post publicado
      if (!cover){
        try {
          const { data: post } = await supabase.from('posts').select('contenido,portada_url,portada_y').eq('slug', p.slug).eq('publicado', true).single();
          cover = post?.portada_url || extraerPrimeraImagen(post?.contenido||''); pos = (typeof post?.portada_y === 'number') ? post.portada_y : 50;
          if (cover){
            el.classList.add('has-bg');
            const bg = document.createElement('div'); bg.className='tarjeta-bg'; bg.style.backgroundImage = `url('${cover}')`; bg.style.backgroundPosition = `center ${pos}%`;
            el.insertBefore(bg, el.firstChild);
          }
        } catch(_){ /* ignore */ }
      }
    });
  }
}
export async function gestionarItinerarios(){
  const { data: { session } } = await supabase.auth.getSession(); if (!session){ location.href = getSiteBase() + 'usuario/login.html'; return; }
  const lista = document.getElementById('misItinerarios'); const form = document.getElementById('formItinerario'); const msg = document.getElementById('msgItin');
  async function cargar(){ const { data } = await supabase.from('itinerarios_usuario').select('id,titulo,contenido,updated_at').order('updated_at',{ascending:false});
    lista.innerHTML='';
    (data||[]).forEach(it => { const el = document.createElement('article'); el.className='tarjeta-articulo';
      el.innerHTML = `<div class="contenido-tarjeta"><h3>${it.titulo}</h3><pre style="white-space:pre-wrap">${it.contenido}</pre><button class="btn btn-secundario" data-id="${it.id}">Eliminar</button></div>`;
      lista.appendChild(el); });
    lista.querySelectorAll('button[data-id]').forEach(btn=>btn.addEventListener('click', async ()=>{ await supabase.from('itinerarios_usuario').delete().eq('id', btn.dataset.id); cargar(); }));
  }
  form.addEventListener('submit', async (e)=>{ e.preventDefault(); const fd = new FormData(form); const payload = Object.fromEntries(fd.entries()); payload.user_id = session.user.id;
    const { error } = await supabase.from('itinerarios_usuario').insert(payload);
    if (error){ msg.textContent='Error al guardar'; msg.className='msg error'; } else { msg.textContent='Guardado'; msg.className='msg ok'; form.reset(); cargar(); }
  });
  cargar();
}
export async function listarItinerariosPublicos(){
  const cont = document.getElementById('listaItinerarios');
  const { data } = await supabase.from('itinerarios_publicos').select('titulo,resumen,slug').order('fecha_pub',{ascending:false});
  cont.innerHTML=''; (data||[]).forEach(p=>{ const el=document.createElement('article'); el.className='tarjeta-articulo';
    el.innerHTML=`<div class="contenido-tarjeta"><h3><a href="../post.html?slug=${p.slug}">${p.titulo}</a></h3><p class="extracto">${p.resumen??''}</p></div>`; cont.appendChild(el); });
}

function extraerPrimeraImagen(md=''){
  const m = md && typeof md === 'string' ? md.match(/!\[[^\]]*\]\(([^)]+)\)/) : null;
  return m ? m[1] : '';
}
