-- 004_demo_blogs.sql — dos posts de ejemplo (2025)
insert into public.posts (slug,titulo,resumen,contenido,categoria,publicado,fecha_pub)
values
('guia-islas-griegas-10-dias', 'Guía: Islas Griegas en 10 días', 'Saltando entre Santorini, Naxos y Milos con ferry.',
$$
![Santorini](https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?q=80&w=1600&auto=format&fit=crop)

## Día 1-3: Santorini
- Oia al atardecer
- Paseo en barco por la caldera

## Día 4-6: Naxos
- Playas de Agios Prokopios
- Pueblos del interior (Halki)

## Día 7-10: Milos
- Sarakiniko al amanecer
- Crucero por Kleftiko

> Consejos: compra los billetes de ferry con antelación y reserva motos para moverte por las islas.
$$,
'Guías', true, now()),

('itinerario-costa-oeste-usa-2025', 'Costa Oeste USA en 14 días (2025)', 'Parques nacionales y ciudades míticas en dos semanas.',
$$
![Yosemite](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop)

### Ruta
1. San Francisco (2)
2. Yosemite (2)
3. Death Valley (1)
4. Las Vegas (1)
5. Zion (1)
6. Bryce (1)
7. Page (1)
8. Gran Cañón (1)
9. Los Ángeles (3)

> Tip: compra el Annual Pass para los parques (80$) y madruga para evitar colas.
$$,
'Itinerarios', true, now())
on conflict (slug) do nothing;

