# Trascendental Oficial — inventario de despliegue

Esta entrega contiene **exactamente 15 archivos**, sin carpetas envolventes, `node_modules` ni `dist`. 11 archivos se ven normalmente como archivos de aplicación, más este manifiesto visible; 3 entradas están ocultas en macOS/Windows y se incluyen intencionalmente (ver abajo).

| Ruta en el ZIP | Propósito | Reemplazar en GitHub |
| --- | --- | --- |
| `index.html` | Entrada HTML de Vite | Sí |
| `main.jsx` | Entrada React | Sí |
| `App.jsx` | Landing, panel y modales | Sí |
| `styles.css` | Diseño y responsive | Sí |
| `supabase.js` | Cliente y consultas de Supabase | Sí |
| `supabase-schema.sql` | Referencia SQL para la base, **no se ejecuta en deploy** | Sí |
| `package.json` | Dependencias y scripts unificados | Sí |
| `vite.config.js` | Base `/` en Vercel y subruta en GitHub Pages | Sí |
| `vercel.json` | Build y fallback SPA de Vercel | Sí |
| `README.md` | Manual del proyecto | Sí |
| `DEPLOY-VERCEL.md` | Guía de publicación y variables | Sí |
| `MANIFEST.md` | Este inventario | Sí |
| `.env.production` | Variables públicas de Vite (solo publishable key, nunca DB password) | Sí, archivo oculto |
| `.gitignore` | Evita subir dependencias y secretos locales | Sí, archivo oculto |
| `.github/workflows/pages.yml` | Compilación automática en GitHub Pages | Sí, ruta oculta |

## Archivos de entregas anteriores que NO deben permanecer

Borra del repositorio anterior si existen: `demo.html`, `demo.jsx`, `ARCHITECTURE.md`, `FLOW-TRANSFERENCIAS.md`, `.env.example`.

Los primeros dos son una demo alternativa obsoleta y pueden inducir a publicar la entrada equivocada. Los tres restantes eran documentación duplicada y la configuración antigua; la información de operación quedó unificada en `README.md` y `DEPLOY-VERCEL.md`.

**No borres** `.github/workflows/pages.yml`, `.env.production` ni `.gitignore`: algunos exploradores no los muestran por comenzar con punto.

## Precauciones

- Extrae el ZIP y copia **todos los elementos, incluidos ocultos**, a la **raíz** del repositorio. En macOS Finder usa `Cmd + Shift + .` para alternar la visibilidad de ocultos.
- No subas `node_modules`, `dist`, bases de datos locales ni credenciales de PostgreSQL.
- Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` también en Vercel Settings > Environment Variables. La variable publishable es apta para navegador; jamás uses `service_role`.
- En Vercel: framework Vite, root `./`, build `npm run build`, output `dist`, production branch `main`.
- Si GitHub Pages también se usa, configura Pages con GitHub Actions; **no** intentes servir `main.jsx` directamente.
- `/` y `/public` son públicos; `/admin` requiere autenticación y autorización en Supabase.
