# Trascendental Oficial

Landing pública y panel de administración de servicios turísticos construidos con React + Vite, listos para ser compilados con Vercel o GitHub Actions (GitHub Pages). Todos los archivos fuente principales están en la raíz.

## Publicación rápida

1. Copia todo el contenido de este directorio a la **raíz** del repositorio `GustavoChan21/trascendentaloficial`, conservando `.github/workflows/pages.yml` y `.env.production`.
2. En Vercel enlaza ese repositorio con proyecto `trascendentaloficial`, rama `main`, preset Vite, build `npm run build`, output `dist`, root `./`. Los siguientes pushes despliegan automáticamente.
3. En GitHub > Settings > Pages elige **GitHub Actions** para habilitar también el build de GitHub Pages. Sin esa opción no funciona el JSX.
4. Supabase ya tiene tablas/RLS/RPC si se aplicó `supabase-schema.sql`. No vuelvas a ejecutar el SQL si ya está instalado.
5. En Supabase Authentication crea al primer usuario y autorízalo en `public.admin_users` siguiendo `DEPLOY-VERCEL.md`.
6. En el panel configura datos reales, imágenes, precios, cupos, horarios, teléfonos, y banco. El contenido inicial es de ejemplo. **No anuncies reservas hasta sustituir todos los datos de prueba.**

## Desarrollo local

```bash
npm install
npm run dev
npm run build
```

- `supabase.js` aloja el cliente de lectura pública y funciones seguras de reserva.
- `supabase-schema.sql` define RLS y control de concurrencia del cupo.
- `vercel.json` define compilación Vite y fallback SPA.
- `.env.production` contiene exclusivamente la URL y clave **publishable**, nunca una contraseña o clave secreta.
- `DEPLOY-VERCEL.md` describe el paso a paso.

### Estado de pagos

La transferencia **no se verifica automáticamente**. La versión actual permite registrar la referencia o nombre del comprobante, pero no almacena archivos en Supabase Storage. El guía debe recibir el comprobante por WhatsApp, verificar el movimiento bancario y confirmar manualmente la reserva desde el panel.

### Seguridad pendiente para operación comercial

Antes de anunciar reservas reales, añadir antispam, rate limiting, verificación de fechas/salidas, almacenamiento privado de comprobantes, registro de auditoría y notificaciones al cliente. Las funciones anónimas SECURITY DEFINER son puntos públicos intencionales, pero requieren monitoreo y protección adicional frente a abuso.
