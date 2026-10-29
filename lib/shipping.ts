/**
 * Zonas de entrega. Cali y su área metropolitana tienen entrega exprés;
 * el resto del país, envío nacional. Ajustar cuando se defina la cobertura real.
 */
export const DEPARTMENTS = [
  'Valle del Cauca', 'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila',
  'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Vaupés', 'Vichada',
] as const

export const EXPRESS_CITIES = ['Cali', 'Jamundí', 'Yumbo', 'Palmira', 'Candelaria'] as const
export const VALLE_CITIES = [...EXPRESS_CITIES, 'Buenaventura', 'Tuluá', 'Cartago', 'Buga', 'Florida', 'Pradera', 'El Cerrito', 'Dagua', 'Zarzal', 'Roldanillo', 'Sevilla', 'Caicedonia'] as const

export type DeliveryZone = { id: 'express' | 'national'; label: string; minDays: number; maxDays: number }

export const ZONES: Record<DeliveryZone['id'], DeliveryZone> = {
  express: { id: 'express', label: 'Entrega exprés Cali', minDays: 1, maxDays: 2 },
  national: { id: 'national', label: 'Envío nacional', minDays: 3, maxDays: 7 },
}

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

export function zoneFor(city: string, department?: string): DeliveryZone {
  if (department && normalize(department) !== normalize('Valle del Cauca')) return ZONES.national
  const c = normalize(city)
  return EXPRESS_CITIES.some((x) => normalize(x) === c) ? ZONES.express : ZONES.national
}

/** Suma días hábiles (lunes a sábado; los domingos no hay entregas). */
export function addBusinessDays(from: Date, days: number) {
  const date = new Date(from)
  // Pedidos después de las 2:00 p. m. salen al día siguiente.
  if (date.getHours() >= 14) days += 1
  while (days > 0) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() !== 0) days -= 1
  }
  return date
}

const fmt = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })

export function deliveryWindow(zone: DeliveryZone, now = new Date()) {
  const from = addBusinessDays(now, zone.minDays)
  const to = addBusinessDays(now, zone.maxDays)
  return { from, to, label: `${fmt.format(from)} y el ${fmt.format(to)}`.replaceAll('.', '') }
}
