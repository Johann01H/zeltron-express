=== Zeltron Core ===
Requires at least: 6.5
Requires PHP: 8.1
Requires Plugins: woocommerce, wp-graphql
Stable tag: 1.8.1

Núcleo headless de ZELTRON Express (admin.zeltronexpress.com).

== Qué hace ==

* API GraphQL para la tienda en Next.js:
  - zeltronProducts, zeltronCategories, zeltronStoreSettings (públicas)
  - zeltronOrder(number, phone) y la mutación zeltronCreateOrder (solo con X-Zeltron-Secret)
* Pedidos contra entrega con estados propios: Por confirmar → Confirmado → Despachado → Completado / Devuelto.
* Número de pedido ZX-AAAAMMDD-XXXXXX igual en la tienda, en el panel y en WhatsApp.
* Campos privados por producto: proveedor, enlace, costo, "Más vendido" y "Envío gratis".
* Margen por producto y por pedido; zona de entrega; transportadora y número de guía.
* Botón "Confirmar por WhatsApp" con el mensaje listo en cada pedido.
* Avisa a la tienda (/api/revalidate) cuando cambian productos, inventario o categorías.
* Seguridad: XML-RPC bloqueado, usuarios ocultos en la API, sitio público redirigido a la tienda.

== Instalación ==

1. Plugins → Añadir nuevo → Subir plugin → zeltron-core.zip → Activar.
2. WooCommerce → Zeltron: copia el "Endpoint GraphQL" y el "Secreto de la API".
3. En Vercel (Settings → Environment Variables):
   WORDPRESS_GRAPHQL_URL = https://admin.zeltronexpress.com/graphql
   ZELTRON_API_SECRET    = (el secreto)
   y vuelve a desplegar.

Opcional (más seguro): define el secreto en wp-config.php
   define( 'ZELTRON_API_SECRET', '...' );

== Cómo cargar productos ==

* Categorías: crea la categoría (ej. "Audio") y dentro sus subcategorías (ej. "Audífonos").
  Asigna cada producto a la subcategoría.
* Precio normal = precio "antes"; precio rebajado = precio de venta.
* Marca: Productos → Marcas.
* Características: pestaña Atributos, marcando "Visible en la página del producto".
* Variantes (color, capacidad): producto variable.
* Proveedor y costo: pestaña General, bloque "Zeltron · Proveedor y margen".

== Changelog ==

= 1.8.1 =
* Portada: nuevo tipo «Imagen completa» (la imagen ocupa toda la portada, con versión opcional para celular y enlace).

= 1.8.0 =
* Nuevo: menú «Portada» para armar el slider principal del inicio (etiqueta, título, texto, dos botones y tarjeta con producto, imagen propia o nada; fecha de fin y orden).
* Nuevo: consulta pública zeltronHeroSlides.

= 1.7.1 =
* Banners: se envían las medidas de cada imagen para mostrarlas completas, sin recortes.

= 1.7.0 =
* Nuevo: menú «Financieras» (logo oficial, para buen historial o reportados, enlace de solicitud o asesor por WhatsApp) con botón para crear las 8 del convenio.
* Nuevo: consulta pública zeltronFinanciers para el footer, la página /credito y la página de producto.

= 1.6.0 =
* Nuevo: menú «Banners» con secciones para armar mosaicos publicitarios en el inicio (grande, vertical, pequeño o ancho), con enlace a producto, categoría o URL, fecha de fin e imagen opcional para celular.
* Nuevo: consulta pública zeltronBannerSections.

= 1.5.0 =
* Nuevo: menú «Shorts» para subir videos demostrativos verticales (archivo MP4 o enlace de YouTube Shorts), con portada, producto vinculado, texto y orden.
* Nuevo: consulta pública zeltronShorts para la tienda; publicar o editar un short actualiza el sitio.

= 1.4.0 =
* Nuevo: memoria del bot de WhatsApp (zeltronBotState / zeltronSetBotState) para el webhook de la tienda.

= 1.3.0 =
* Nuevo: los favoritos del cliente se guardan en su cuenta (zeltronSetFavorites) y se ven en cualquier dispositivo.

= 1.2.0 =
* Nuevo: «Mi cuenta» completa: foto de perfil, datos personales, cambio de contraseña, varias direcciones con una principal y pedidos con sus productos.

= 1.1.0 =
* Nuevo: cuentas de cliente para la tienda (registro, inicio de sesión, cierre de sesión y recuperación de contraseña por correo) vía WPGraphQL con X-Zeltron-Secret.

= 1.0.2 =
* Nuevo: WooCommerce → Zeltron → «Asignar imágenes por referencia» enlaza cada producto con la imagen de Medios que se llama como su SKU.
