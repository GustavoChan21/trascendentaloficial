# Trascendental Oficial — UI v2

React + Vite + Supabase + Vercel. Archivos de la aplicación en la raíz (15 archivos en total (incluyendo archivos ocultos y workflow `.github/workflows/pages.yml`)).

## Rutas
- `/` y `/public`: landing pública (no muestra enlace administrativo).
- `/admin`: panel protegido mediante Supabase Auth y `public.admin_users`.
- En GitHub Pages: `/trascendentaloficial/public` y `/trascendentaloficial/admin`; se publica `404.html` para deep links.

## Desarrollo
```bash
npm install
npm run dev
npm run build
```

## Vercel
Se conecta repositorio GitHub `GustavoChan21/trascendentaloficial` rama `main`, Framework Vite, Build `npm run build`, Output `dist`, Root `./`. `vercel.json` ya contiene el rewrite de SPA.

## Supabase
Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` existen en `.env.production`, y también deben configurarse en Vercel. Nunca incluir `service_role` o password PostgreSQL en frontend.

Base: `site_state` (contenido), `admin_users` (control de acceso), `tour_bookings` (apartados), `storage.site-media` (imágenes del contenido). El esquema está en `supabase-schema.sql`.

Autorización del primer admin: crear usuario en Authentication > Users y ejecutar `insert into public.admin_users(user_id) values ('UUID-USUARIO')`. Para imágenes: bucket público `site-media`, escritura restringida a admins.

**Importante:** aún NO se almacenan archivos de comprobantes de pago en Storage, sólo se registra su nombre y se solicita enviarlos por WhatsApp. No se debe aprobar una transferencia sin revisar el comprobante real. Las reservas usan RPC transaccional para impedir sobreventa simultánea.

## UI
Editor modal para identidad/portada, textos de secciones, servicios (imagen/estado/precio/cupo/anticipo), transferencias, enlaces y políticas. El editor realiza persistencia en Supabase. Las imágenes se pueden subir como JPG/PNG/WebP de hasta 8 MB.

Referencias consultadas: https://github.com/shadcndashboard/shadcndashboard y https://github.com/arnobt78/Travel-Tourism-Landing-Page--React-Frontend. Implementación visual original; no se copiaron archivos de esos repositorios.

## Inventario y actualización desde versiones anteriores
Consulta `MANIFEST.md` para la lista definitiva de **15 archivos** y los archivos obsoletos que se deben eliminar al actualizar el repositorio. No mezcles la demo ni los `.jsx` de entregas anteriores.
