# Trascendental Oficial: puesta en producción

## 1. Publicación y Vercel

Los archivos `index.html`, `App.jsx`, `main.jsx`, `styles.css`, `supabase.js`, `vite.config.js`, `vercel.json` y `package.json` están en la **raíz** de GitHub.

Conecta **GustavoChan21/trascendentaloficial**, rama `main`, en Vercel > Proyecto `trascendentaloficial` > Settings > Git. Si ya existe, reconecta el repositorio existente; **no crees un proyecto duplicado**. En Build and Deployment selecciona `Vite`, Root `./`, Build `npm run build`, Output `dist`, Install `npm install` y Node.js `22.x`. Vercel generará un deployment por cada push a `main` si Git integration está habilitada.

`vercel.json` habilita rutas SPA. `.env.production` contiene **solamente** la URL y clave publicable de Supabase; no contiene secretos. También puedes administrar estas variables como `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` desde Settings > Environment Variables.

### GitHub Pages

El enlace `gustavochan21.github.io/trascendentaloficial/` queda en blanco si GitHub Pages publica los archivos `.jsx` sin compilar. Se incluye `.github/workflows/pages.yml` para compilar y publicar `/dist` automáticamente. En GitHub > Settings > Pages selecciona **Build and deployment > Source > GitHub Actions**. Vercel publica de forma independiente y puede ser el dominio principal.

## 2. Base de datos Supabase

Proyecto: `coprcyhrvjhtmmzutzcw`. Ejecuta `supabase-schema.sql` en Supabase SQL Editor (una sola vez, idempotente). El esquema crea tablas `site_state`, `admin_users`, `tour_bookings`, RLS, funciones públicas para cupo y creación transaccional de apartados.

En Supabase > Authentication > Users, crea un usuario administrativo con correo y contraseña. Copia su **User UID** y ejecuta en SQL Editor:

```sql
insert into public.admin_users (user_id) values ('REEMPLAZA-CON-EL-UID-DEL-USUARIO') on conflict do nothing;
```

No hay acceso administrativo público ni clave maestra en navegador. El primer administrador debe configurarse en Supabase.

## 3. Primer contenido en producción

El sitio puede abrir con contenido de ejemplo almacenado localmente. Inicia sesión en Panel admin y modifica cualquier campo: la configuración se guarda en `site_state` automáticamente. **Antes de ofrecer reservas reales**, cambia el nombre comercial, datos bancarios, CLABE, teléfono, precios y cupos de ejemplo. Al guardarse, el contenido queda visible para todos.

## 4. Transferencias

`create_tour_booking()` calcula el total y anticipo en el servidor, comprueba disponibilidad con un bloqueo transaccional y genera folio y expiración. El cliente registra la referencia del comprobante. **El archivo no se sube todavía a Storage:** la persona debe enviarlo por WhatsApp y el administrador verificarlo en el banco antes de confirmar. No marcar como pagado automáticamente.

## 5. Límites actuales

- El backend necesita ejecutar SQL y dar de alta un primer admin antes de usarlo.
- No hay carga de archivos a Storage ni conciliación bancaria automática.
- Falta antispam/CAPTCHA y limitación de solicitudes para tráfico público elevado.
- Las reservaciones se organizan por servicio, fecha y hora; un próximo CRUD de salidas definirá horarios válidos antes de permitir compras reales.
- No se validó un build real en este entorno sin dependencias npm externas. Ejecuta `npm install && npm run build` y verifica consola en Vercel.
