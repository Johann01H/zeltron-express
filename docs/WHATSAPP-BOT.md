# Bot de WhatsApp de ZELTRON Express

El bot vive en la tienda (`/api/whatsapp`) y usa la **API oficial de WhatsApp (Cloud API de Meta)**.
Recuerda la conversación de cada cliente durante 24 horas en WordPress (plugin `zeltron-core` 1.4.0+).

## Qué hace
- **Saludo con menú**: buscar producto, ofertas, rastrear pedido, envíos y pagos, garantías, asesor.
- **Búsqueda**: el cliente escribe con sus palabras («audífonos inalámbricos», «tienen nintendo?») y recibe una lista; al elegir, la ficha con foto, precio y botón «Lo quiero» que lleva a comprar en la tienda.
- **Botón «Pedir por WhatsApp» de la tienda**: el bot reconoce el producto y responde con su ficha.
- **Rastreo**: con el número de pedido `ZX-…` y el WhatsApp del cliente (o el celular con el que compró).
- **Asesor**: si el número de asesores es el mismo del bot (coexistencia), el bot se calla 12 horas con ese cliente y respondes desde la app; si un asesor escribe primero desde la app, también se calla. El cliente vuelve al bot escribiendo *menú*. Si el número de asesores es otro, el bot le da un botón para escribirle con el contexto.

## Configuración (una sola vez)
1. **Meta Business**: en business.facebook.com crea o elige el portafolio de ZELTRON y verifica la empresa cuando te lo pida.
2. **App**: en developers.facebook.com → Mis apps → Crear app → tipo *Empresa* → agrega el producto **WhatsApp**.
3. **Número**:
   - *Mismo número 302 593 1994 con la app (coexistencia)*: elige la opción de conectar un número de la app WhatsApp Business (escaneas un QR con el celular). Necesitas la app Business actualizada y abrirla al menos cada 14 días.
   - *Número nuevo solo para el bot*: agrégalo en WhatsApp → Configuración de la API y verifícalo por SMS. Ese número no puede estar activo en la app de WhatsApp. En Vercel pon `NEXT_PUBLIC_WHATSAPP_NUMBER` con el número del bot y `WHATSAPP_ADVISOR_NUMBER=573025931994`.
4. **Token permanente**: Meta Business → Configuración → Usuarios del sistema → crea uno (Admin), asígnale la app y el número, y genera un token con los permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
5. **Variables en Vercel** (Settings → Environment Variables), luego *Redeploy*:
   `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` y, si aplica, `NEXT_PUBLIC_WHATSAPP_NUMBER` y `WHATSAPP_ADVISOR_NUMBER`.
6. **Webhook**: en la app de Meta → WhatsApp → Configuración → Webhook:
   - URL: `https://www.zeltronexpress.com/api/whatsapp`
   - Token de verificación: el mismo `WHATSAPP_VERIFY_TOKEN`
   - Suscríbete a **messages** (y a **smb_message_echoes** si usas coexistencia).
7. Escribe «hola» al número desde otro celular.

## Costos
Escribirle al cliente dentro de las 24 horas siguientes a su mensaje es un «mensaje de servicio».
Meta da 1.000 mensajes de servicio gratis al mes por número; después se cobran según la tarifa de Colombia.
Revisa la tarifa vigente en la documentación de precios de Meta antes de lanzar campañas.
