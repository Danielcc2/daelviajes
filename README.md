# DAEL Viajes — Sitio 2025
Frontend HTML/CSS/JS + **Supabase** (Auth, DB, Storage). Estilo oscuro con acento verde.

## Arranque rápido
1) Crea proyecto en Supabase y copia `SUPABASE_URL` y `ANON_KEY` a `config/supabase.js`.
2) En Supabase ejecuta `scripts/001_schema.sql` y luego `scripts/utils/generate_slugs.sql`.
3) Ejecuta `scripts/002_seed.sql` y `scripts/003_more_seed.sql` para datos de ejemplo.
4) Crea bucket público **imagenes-posts** en Storage.
5) `npx serve . -l 3000` y abre `http://localhost:3000`.
6) En `profiles`, marca tu usuario `is_admin=true`.

## Despliegue SOLO con GitHub Actions + GitHub Pages
- Workflow en `.github/workflows/deploy.yml` (build+lint+deploy a `gh-pages`).

