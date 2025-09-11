create extension if not exists unaccent;
create or replace function public.slugify(input text) returns text language sql immutable as $$
  select regexp_replace(lower(trim(regexp_replace(unaccent(coalesce(input,'')),'[^a-zA-Z0-9\s-]+','','g'))),'\s+','-','g'); $$;
create or replace function public.posts_slug_default() returns trigger language plpgsql as $$
begin if new.slug is null or length(new.slug)=0 then new.slug := public.slugify(new.titulo); end if; return new; end; $$;
drop trigger if exists posts_slug_default on public.posts;
create trigger posts_slug_default before insert on public.posts for each row execute function public.posts_slug_default();
