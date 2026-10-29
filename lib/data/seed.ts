import type { Category, Product } from '../types'

/**
 * Catálogo de respaldo (solo desarrollo).
 * Se usa únicamente cuando WORDPRESS_GRAPHQL_URL no está configurada.
 * En producción el catálogo sale de WordPress vía WPGraphQL.
 */
export const seedProducts: Product[] = [
  {
    "id": "1",
    "slug": "audifonos-bluetooth-pro",
    "name": "Audífonos Bluetooth Pro ANC",
    "category": "Audio",
    "subcategory": "Audífonos",
    "brand": null,
    "description": "Disfruta tus canciones con sonido envolvente y menos ruido alrededor gracias a la cancelación activa. Su batería de larga duración te acompaña durante el trabajo, los viajes y tus momentos de descanso.",
    "price": 89900,
    "compareAtPrice": 129900,
    "images": [
      "/products/audio.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "32 horas"
    },
    "stock": 8,
    "isBestSeller": true,
    "freeShipping": false
  },
  {
    "id": "2",
    "slug": "smartwatch-fit-x2",
    "name": "Smartwatch Fit X2",
    "category": "Smartwatches",
    "subcategory": "Relojes inteligentes",
    "brand": null,
    "description": "Registra tu actividad diaria, recibe notificaciones y mantén tus metas a la vista desde la muñeca. Su pantalla HD y diseño ligero hacen que sea cómodo para usarlo todo el día.",
    "price": 119900,
    "compareAtPrice": 169900,
    "images": [
      "/products/smartwatch.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "1.8” HD"
    },
    "stock": 11,
    "isBestSeller": true,
    "freeShipping": false
  },
  {
    "id": "3",
    "slug": "cargador-rapido-65w",
    "name": "Cargador GaN rápido 65W",
    "category": "Carga y energía",
    "subcategory": "Cargadores rápidos",
    "brand": null,
    "description": "Carga tu portátil, celular y otros dispositivos con potencia en un formato compacto. La tecnología GaN reduce el tamaño sin sacrificar velocidad ni seguridad.",
    "price": 69900,
    "compareAtPrice": 89900,
    "images": [
      "/products/charger.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "65W"
    },
    "stock": 14,
    "isBestSeller": true,
    "freeShipping": false
  },
  {
    "id": "4",
    "slug": "lampara-led-escritorio",
    "name": "Lámpara LED inteligente de escritorio",
    "category": "Hogar inteligente",
    "subcategory": "Iluminación inteligente",
    "brand": null,
    "description": "Dale a tu escritorio una luz más cómoda para estudiar, trabajar o leer. Cambia entre tres temperaturas según el momento y crea un ambiente agradable sin ocupar mucho espacio.",
    "price": 79900,
    "compareAtPrice": 99900,
    "images": [
      "/products/lamp.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "3 temperaturas"
    },
    "stock": 20,
    "isBestSeller": true,
    "freeShipping": true
  },
  {
    "id": "5",
    "slug": "soporte-magnetico-celular",
    "name": "Soporte magnético para celular",
    "category": "Accesorios para celular",
    "subcategory": "Soportes para celular",
    "brand": null,
    "description": "Mantén tu celular visible y estable mientras conduces o trabajas. Su sistema magnético permite colocarlo y retirarlo con una sola mano y el acabado de aluminio combina con cualquier espacio.",
    "price": 39900,
    "compareAtPrice": 59900,
    "images": [
      "/products/phone-stand.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "Aluminio"
    },
    "stock": 30,
    "isBestSeller": true,
    "freeShipping": false
  },
  {
    "id": "6",
    "slug": "teclado-mecanico-rgb",
    "name": "Teclado mecánico compacto RGB",
    "category": "Gamer y oficina",
    "subcategory": "Teclados mecánicos",
    "brand": null,
    "description": "Escribe con respuesta táctil precisa y una iluminación RGB que transforma tu escritorio. El formato compacto libera espacio para el mouse sin renunciar a una experiencia mecánica completa.",
    "price": 149900,
    "compareAtPrice": 189900,
    "images": [
      "/products/keyboard.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "Formato 60%"
    },
    "stock": 6,
    "isBestSeller": true,
    "freeShipping": true
  },
  {
    "id": "7",
    "slug": "powerbank-20000mah",
    "name": "Power bank 20.000 mAh carga rápida",
    "category": "Carga y energía",
    "subcategory": "Power banks",
    "brand": null,
    "description": "Lleva energía extra para tus dispositivos cuando estés lejos de un tomacorriente. Su carga rápida y gran capacidad te dan tranquilidad durante viajes, jornadas largas o emergencias.",
    "price": 89900,
    "compareAtPrice": 119900,
    "images": [
      "/products/powerbank.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "22.5W"
    },
    "stock": 9,
    "isBestSeller": true,
    "freeShipping": false
  },
  {
    "id": "8",
    "slug": "camara-wifi-360",
    "name": "Cámara WiFi 360° con visión nocturna",
    "category": "Hogar inteligente",
    "subcategory": "Cámaras de seguridad",
    "brand": null,
    "description": "Vigila tu hogar desde cualquier lugar con video Full HD y visión nocturna. La vista 360° ayuda a cubrir más espacio y recibir alertas cuando detecta movimiento.",
    "price": 129900,
    "compareAtPrice": 169900,
    "images": [
      "/products/camera.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "1080p"
    },
    "stock": 12,
    "isBestSeller": false,
    "freeShipping": true
  },
  {
    "id": "9",
    "slug": "mouse-ergonomico-wireless",
    "name": "Mouse ergonómico inalámbrico",
    "category": "Gamer y oficina",
    "subcategory": "Mouse",
    "brand": null,
    "description": "Trabaja o juega con mayor comodidad gracias a su forma ergonómica y conexión inalámbrica estable. El sensor de 1600 DPI ofrece un control fluido para las tareas del día a día.",
    "price": 59900,
    "compareAtPrice": 79900,
    "images": [
      "/products/mouse.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "1600 DPI"
    },
    "stock": 18,
    "isBestSeller": false,
    "freeShipping": true
  },
  {
    "id": "10",
    "slug": "hub-usb-c-7-en-1",
    "name": "Hub USB-C 7 en 1",
    "category": "Accesorios para celular",
    "subcategory": "Hubs y adaptadores",
    "brand": null,
    "description": "Convierte un solo puerto USB-C en una estación práctica para tu portátil. Conecta pantallas, memorias y periféricos sin complicaciones desde un hub pequeño y fácil de llevar.",
    "price": 109900,
    "compareAtPrice": 139900,
    "images": [
      "/products/hub.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "4K"
    },
    "stock": 15,
    "isBestSeller": false,
    "freeShipping": true
  },
  {
    "id": "11",
    "slug": "parlante-portatil-ipx7",
    "name": "Parlante portátil resistente al agua",
    "category": "Audio",
    "subcategory": "Bafles",
    "brand": null,
    "description": "Lleva tu música a la piscina, la playa o la ducha sin preocuparte por las salpicaduras. Ofrece un sonido potente en un cuerpo portátil listo para acompañar tus planes.",
    "price": 99900,
    "compareAtPrice": 129900,
    "images": [
      "/products/speaker.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "20W"
    },
    "stock": 10,
    "isBestSeller": false,
    "freeShipping": false
  },
  {
    "id": "12",
    "slug": "cable-usb-c-nylon",
    "name": "Cable USB-C a USB-C reforzado",
    "category": "Carga y energía",
    "subcategory": "Cables",
    "brand": null,
    "description": "Carga y sincroniza tus equipos con un cable preparado para el uso diario. El recubrimiento de nylon ayuda a resistir dobleces y el soporte de hasta 100W se adapta a dispositivos compatibles.",
    "price": 29900,
    "compareAtPrice": 39900,
    "images": [
      "/products/cable.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "100W"
    },
    "stock": 40,
    "isBestSeller": false,
    "freeShipping": true
  },
  {
    "id": "13",
    "slug": "ring-light-tripo",
    "name": "Ring light 26 cm con trípode",
    "category": "Gamer y oficina",
    "subcategory": "Accesorios para streaming",
    "brand": null,
    "description": "Mejora tus videos, llamadas y fotos con una iluminación uniforme y favorecedora. El trípode incluido permite ajustar la altura y encontrar el ángulo ideal en segundos.",
    "price": 74900,
    "compareAtPrice": 99900,
    "images": [
      "/products/ring-light.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "26 cm"
    },
    "stock": 16,
    "isBestSeller": false,
    "freeShipping": false
  },
  {
    "id": "14",
    "slug": "audifonos-gamer-wireless",
    "name": "Audífonos gamer inalámbricos",
    "category": "Audio",
    "subcategory": "Audífonos gamer",
    "brand": null,
    "description": "Juega con libertad y sin cables que estorben gracias a su conexión inalámbrica y batería de larga duración. El audio inmersivo y el micrófono integrado ayudan a mantenerte conectado con tu equipo.",
    "price": 159900,
    "compareAtPrice": 199900,
    "images": [
      "/products/gamer-headset.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "40 horas"
    },
    "stock": 7,
    "isBestSeller": false,
    "freeShipping": true
  },
  {
    "id": "15",
    "slug": "teclado-bluetooth-slim",
    "name": "Teclado Bluetooth Slim multi dispositivo",
    "category": "Gamer y oficina",
    "subcategory": "Teclados",
    "brand": null,
    "description": "Escribe cómodamente en computador, tablet o celular con un teclado delgado que cambia entre varios dispositivos. Su conexión Bluetooth facilita trabajar desde cualquier lugar.",
    "price": 89900,
    "compareAtPrice": 109900,
    "images": [
      "/products/slim-keyboard.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "Bluetooth 5.0"
    },
    "stock": 13,
    "isBestSeller": false,
    "freeShipping": false
  },
  {
    "id": "16",
    "slug": "smart-plug-wifi",
    "name": "Enchufe inteligente WiFi",
    "category": "Hogar inteligente",
    "subcategory": "Enchufes inteligentes",
    "brand": null,
    "description": "Controla lámparas y pequeños electrodomésticos desde el celular o crea horarios automáticos. Este enchufe WiFi hace más fácil ahorrar energía y darle inteligencia a tu hogar.",
    "price": 54900,
    "compareAtPrice": 69900,
    "images": [
      "/products/smart-plug.png"
    ],
    "variants": [
      "Única"
    ],
    "specs": {
      "Característica": "WiFi 2.4GHz"
    },
    "stock": 22,
    "isBestSeller": false,
    "freeShipping": true
  }
]

export const seedCategories: Category[] = [
  {
    "name": "Audio",
    "subcategories": [
      "Audífonos",
      "Audífonos gamer",
      "Bafles"
    ]
  },
  {
    "name": "Smartwatches",
    "subcategories": [
      "Relojes inteligentes"
    ]
  },
  {
    "name": "Accesorios para celular",
    "subcategories": [
      "Soportes para celular",
      "Hubs y adaptadores"
    ]
  },
  {
    "name": "Carga y energía",
    "subcategories": [
      "Cargadores rápidos",
      "Power banks",
      "Cables"
    ]
  },
  {
    "name": "Hogar inteligente",
    "subcategories": [
      "Iluminación inteligente",
      "Cámaras de seguridad",
      "Enchufes inteligentes"
    ]
  },
  {
    "name": "Gamer y oficina",
    "subcategories": [
      "Teclados mecánicos",
      "Teclados",
      "Mouse",
      "Accesorios para streaming"
    ]
  }
]
