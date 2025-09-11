-- Actualiza la vista de favoritos para incluir portada con fallback
create or replace view public.favoritos_view as
select f.created_at,
       p.slug,
       p.titulo,
       p.resumen,
       p.categoria,
       coalesce(
         p.portada_url,
         (regexp_matches(p.contenido, '!\[[^\]]*\]\(([^)]+)\)', 'n'))[1]
       ) as portada_url
from public.favoritos f
join public.posts p on p.id = f.post_id
where f.user_id = auth.uid();
