# Guía Turístico — Landing + Panel Administrativo

Primera versión funcional en React + Vite preparada para publicarse como sitio estático en GitHub Pages.

## Qué incluye

- Landing pública administrable.
- Catálogo de recorridos y servicios.
- Edición de contenido, imágenes por URL, precios, cupos, anticipos y links.
- Flujo de pre-reserva para recorridos con control de cupo.
- Generación de folio y vigencia de apartado.
- Datos de transferencia configurables.
- Carga simulada de comprobante.
- Panel para confirmar, rechazar o cancelar reservas.
- Persistencia local con `localStorage` para validar toda la UX sin backend.
- Diseño responsive.

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Compilar

```bash
npm run build
npm run preview
```

## Publicar en GitHub Pages

El proyecto usa `base: './'`, por lo que funciona tanto en `usuario.github.io` como en `usuario.github.io/repositorio`.

1. Crea un repositorio y sube estos archivos a la raíz.
2. Ejecuta `npm install`.
3. Configura en `package.json` opcionalmente `homepage` si deseas documentar la URL pública.
4. Ejecuta:

```bash
npm run deploy
```

El script publica `dist/` en la rama `gh-pages`. En GitHub, selecciona esa rama como fuente de Pages si no queda configurada automáticamente.

## Arquitectura recomendada para producción

Esta versión usa `localStorage` sólo como prototipo funcional. Para producción se recomienda:

- Frontend: React + Vite.
- Hosting público: GitHub Pages.
- Backend/BaaS: Supabase.
- Auth del panel: Supabase Auth.
- Base de datos: PostgreSQL de Supabase.
- Imágenes y comprobantes: Supabase Storage.
- Funciones automáticas: Edge Functions / Cron para vencer apartados.
- Notificaciones: correo + WhatsApp mediante proveedor externo.

El archivo `supabase-schema.sql` contiene una base de modelo de datos para la siguiente fase.
