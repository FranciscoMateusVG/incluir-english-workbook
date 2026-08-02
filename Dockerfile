# Static portal deploy for the incluir English workbook (aperture-bhw6i).
# Plain nginx serving the portal/ directory — no build step, no backend.
FROM nginx:alpine
COPY portal/ /usr/share/nginx/html/
# nginx:alpine serves /usr/share/nginx/html on :80 and ships mime.types
# (application/pdf for .pdf downloads) — no custom config needed.
