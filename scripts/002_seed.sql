-- 002_seed.sql
insert into public.posts (slug, titulo, resumen, contenido, categoria, publicado, fecha_pub) values
('guia-portugal-norte-7-dias', 'Guía del norte de Portugal en 7 días', 'Ruta por Oporto, Braga, Guimarães y el Duero.', '# Norte de Portugal\n- Día 1-2: Oporto', 'Guías', true, '2025-09-11T13:49:11Z'),
('itinerario-toscana-5-dias', 'Itinerario por Toscana en 5 días', 'Pueblos medievales y viñedos.', '## Toscana en 5 días', 'Itinerarios', true, '2025-09-11T13:49:11Z'),
('resena-hotel-boutique-malaga', 'Reseña: Hotel Boutique en Málaga', 'Ubicación top y desayuno.', '### Reseña honesta', 'Reseñas', true, '2025-09-11T13:49:11Z'),
('consejos-equipaje-cabina-2025', 'Consejos para equipaje de cabina en 2025', 'Normas al día y trucos.', '### Consejos 2025', 'Consejos', true, '2025-09-11T13:49:11Z')
on conflict (slug) do nothing;
insert into public.itinerarios_publicos (slug, titulo, resumen, contenido, fecha_pub) values
('roma-3-dias', 'Roma en 3 días', 'Ruta clásica por Roma', 'Día 1 Coliseo', '2025-09-11T13:49:11Z')
on conflict (slug) do nothing;
insert into public.contenidos (id, html) values
('home-hero-title', 'Planifica tu próximo viaje con <span class="resaltado">confianza total</span>'),
('home-hero-sub', 'Guías actualizadas, itinerarios listos y reseñas claras para viajar mejor.'),
('sobre-intro', 'Soy la persona detrás de DAEL Viajes. Comparto rutas y guías honestas.')
on conflict (id) do update set html = excluded.html;
