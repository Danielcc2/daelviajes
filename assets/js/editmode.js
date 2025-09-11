import { supabase } from '../../config/supabase.js';
document.addEventListener('DOMContentLoaded', async () => {
  const editables = Array.from(document.querySelectorAll('[data-editable][id]')); if (editables.length===0) return;
  const ids = editables.map(el => el.id);
  const { data } = await supabase.from('contenidos').select('id, html').in('id', ids);
  const map = new Map((data||[]).map(r => [r.id, r.html])); editables.forEach(el => { const saved = map.get(el.id); if (saved) el.innerHTML = saved; });
  const { data: { session } } = await supabase.auth.getSession(); if (!session) return;
  const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single(); if (!prof?.is_admin) return;
  const style = document.createElement('style');
  style.textContent = `.btn-edit{{position:absolute;top:.4rem;right:.4rem;background:#0fdc8b;color:#001b11;border:none;border-radius:.5rem;padding:.2rem .45rem;font-weight:800;cursor:pointer;font-size:.85rem} .editable-wrap{{position:relative;outline:1px dashed #1b2431;border-radius:.35rem}} .editable-on{{outline:1px solid #0fdc8b;box-shadow:0 0 0 2px rgba(15,220,139,.25) inset}}`;
  document.head.appendChild(style);
  editables.forEach(el => {
    if (!el.parentElement.classList?.contains('editable-wrap')) {
      const wrap = document.createElement('div'); wrap.className='editable-wrap'; el.replaceWith(wrap); wrap.appendChild(el);
      const btn = document.createElement('button'); btn.className='btn-edit'; btn.type='button'; btn.textContent='✏️'; wrap.appendChild(btn);
      let active=false;
      btn.addEventListener('click', async () => {
        if (!active){ el.setAttribute('contenteditable','true'); el.classList.add('editable-on'); btn.textContent='💾'; active=true; el.focus(); }
        else { el.removeAttribute('contenteditable'); el.classList.remove('editable-on'); btn.textContent='✏️'; active=false;
          const { error } = await supabase.from('contenidos').upsert({ id: el.id, html: el.innerHTML }, { onConflict:'id' });
          if (error) alert('No se pudo guardar: '+error.message);
        }
      });
    }
  });
});
