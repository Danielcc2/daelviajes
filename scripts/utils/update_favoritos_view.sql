-- Actualiza la vista de favoritos para incluir portada con fallback
create or replace view public.favoritos_view as
select f.created_at,
       p.slug,
       p.titulo,
       p.resumen,
       p.categoria,
       coalesce(
         p.portada_url,
         substring(p.contenido from '!\[[^\]]*\]\(([^)]+)\)')
       ) as portada_url,
       p.portada_y,
       p.portada_x
from public.favoritos f
join public.posts p on p.id = f.post_id
where f.user_id = auth.uid();
