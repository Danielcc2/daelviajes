-- backfill_portadas.sql
-- Rellena posts.portada_url tomando la primera imagen del contenido en Markdown si no tiene portada
update public.posts p
set portada_url = sub.url
from (
  select id,
         (regexp_matches(contenido, '!\[[^\]]*\]\(([^)]+)\)', 'g'))[1] as url
  from public.posts
) as sub
where p.id = sub.id
  and (p.portada_url is null or length(p.portada_url)=0)
  and sub.url is not null;
