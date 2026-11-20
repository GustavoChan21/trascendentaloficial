# Flujo de transferencias para apartar cupo

## Datos que configura el administrador

- Banco.
- Beneficiario.
- CLABE.
- Número de cuenta.
- Prefijo de referencia/folio.
- Horas de vigencia del apartado.
- Porcentaje de anticipo por servicio.
- Instrucciones visibles para el cliente.

## Cálculo

Ejemplo:

- Precio por persona: $650 MXN.
- 3 personas.
- Total: $1,950 MXN.
- Anticipo: 40%.
- Importe para apartar: $780 MXN.

## Bloqueo de cupo

Una reserva ocupa lugares cuando:

- está `confirmed`, o
- está `awaiting_transfer` / `proof_uploaded` y todavía no vence.

Una reserva deja de ocupar lugares cuando:

- vence sin confirmar,
- es rechazada,
- es cancelada.

## Información que recibe el cliente

- Folio único.
- Servicio.
- Fecha y hora.
- Número de personas.
- Total.
- Anticipo requerido.
- Banco.
- Beneficiario.
- CLABE/cuenta.
- Concepto exacto para transferencia.
- Fecha/hora límite.
- Campo para comprobante.
- Estatus de validación.

## Producción

El archivo subido no debe guardarse en el navegador. Debe almacenarse en Storage y asociarse a la reserva mediante una ruta privada o URL firmada.
