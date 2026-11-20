# Despliegue GitHub → Vercel

1. Subir el contenido del ZIP directamente a la raíz de `GustavoChan21/trascendentaloficial`, manteniendo `.github`.
2. En Vercel → Settings → Git, enlazar ese repositorio, Production Branch `main`.
3. En Build Settings seleccionar Vite, Root `./`, Build `npm run build`, Output `dist`, Node 22.x.
4. Configurar variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (ver `.env.example`).
5. Push a `main` inicia despliegue automático y configura fallback para `/admin` y `/public`.
6. En Supabase Authentication crear administrador y autorizar su UID en `admin_users`.

Para GitHub Pages → Settings → Pages → Source: GitHub Actions. El workflow publica `dist` y genera `404.html` para rutas directas.

**No** incluir contraseñas Postgres, claves service_role ni secretos en cliente.
