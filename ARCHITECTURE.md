# Estrategia de arquitectura

## Objetivo

Construir un sistema de guía turístico con dos caras:

1. **Sitio público**: contenido, experiencias, precios, disponibilidad, contacto y reservas.
2. **Panel administrativo**: CMS, catálogo, cupos, transferencias, reservas, comprobantes y enlaces.

## Fase 1 — Prototipo funcional

La versión incluida en este paquete funciona sólo con React en frontend y `localStorage`.
Sirve para validar UX, contenido, navegación, reglas de cupo y flujo de transferencia sin depender todavía de backend.

## Fase 2 — Producción

### Frontend
- React + Vite.
- GitHub Pages para la landing y panel SPA.
- Diseño responsive y componentes reutilizables.

### Backend recomendado
- Supabase Auth para acceso administrativo.
- PostgreSQL para servicios, fechas, reservas y pagos.
- Supabase Storage para imágenes y comprobantes.
- Row Level Security para separar acceso público y administrativo.
- Edge Functions/RPC para operaciones sensibles.

### Regla crítica de disponibilidad

Nunca confirmar el último cupo sólo desde React. La creación del apartado debe ejecutarse en una transacción de backend:

1. Bloquear/consultar disponibilidad real del servicio y fecha.
2. Sumar reservas confirmadas.
3. Sumar pre-reservas aún vigentes.
4. Validar que `ocupado + solicitado <= capacidad`.
5. Insertar la pre-reserva y su vencimiento en la misma operación.

Esto evita sobreventa cuando dos clientes intentan tomar los últimos lugares al mismo tiempo.

## Módulos sugeridos

### Público
- Inicio / Hero.
- Sobre el guía.
- Servicios y recorridos.
- Detalle de experiencia.
- Calendario y disponibilidad.
- Reserva / apartado.
- Datos de transferencia.
- Carga de comprobante.
- Políticas.
- Preguntas frecuentes.
- Contacto / WhatsApp / redes.

### Administrativo
- Dashboard.
- CMS de landing.
- Galería e imágenes.
- Servicios y categorías.
- Tarifas y modalidades de cobro.
- Calendario / salidas.
- Cupos por fecha y horario.
- Reservas.
- Transferencias y comprobantes.
- Clientes.
- Cupones/descuentos (fase posterior).
- Links y redes.
- Configuración general.
- Usuarios/roles.
- Bitácora de cambios.

## Estados de reserva sugeridos

- `awaiting_transfer`: apartado generado, esperando transferencia.
- `proof_uploaded`: comprobante cargado.
- `confirmed`: pago validado y cupo definitivo.
- `rejected`: comprobante rechazado; libera cupo.
- `cancelled`: cancelada; libera cupo.
- `expired`: venció la ventana de pago; libera cupo.

## Flujo de transferencia

1. Cliente selecciona servicio, fecha, hora y personas.
2. Backend valida disponibilidad.
3. Se crea folio y vencimiento, por ejemplo 2 horas.
4. Se bloquea temporalmente el cupo.
5. Se muestran banco, beneficiario, CLABE, cuenta, concepto y monto exacto.
6. Cliente carga comprobante.
7. Administrador valida.
8. Si aprueba: `confirmed`.
9. Si rechaza o vence: se libera el cupo.
10. Se envía confirmación y detalles del punto de encuentro.

## Evolución de pagos

Conviene modelar desde el inicio `payment_method` y `payment_status`, aunque la primera versión use sólo transferencia. Así después pueden añadirse Stripe, Mercado Pago o links de pago sin rehacer la reserva.
