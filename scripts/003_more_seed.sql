-- 003_more_seed.sql
insert into public.posts (slug,titulo,resumen,contenido,categoria,publicado,fecha_pub) values
('guia-japon-2025','Guía de Japón 2025','Tokio, Kioto y Osaka','# Japón 2025','Guías',true, now()),
('guia-islandia-anillo','Islandia: Ruta del Anillo','Vuelta en 10 días','Carreteras y clima.','Guías',true, now()),
('consejos-seguro-viaje','Cómo elegir seguro de viaje','Coberturas clave','Salud y cancelaciones.','Consejos',true, now()),
('resena-riad-marrakech','Reseña: Riad en Marrakech','Encanto y ubicación','Terraza y desayuno.','Reseñas',true, now()),
('itinerario-nueva-york-4-dias','NYC en 4 días','Manhattan y Brooklyn','Museos y miradores.','Itinerarios',true, now())
on conflict (slug) do nothing;
