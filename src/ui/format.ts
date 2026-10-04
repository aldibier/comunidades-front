const ZONE = 'America/Bogota'

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: ZONE,
  }).format(date)
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: ZONE,
  }).format(date)
}

/** Reads a datetime-local value as America/Bogota, which does not observe DST. */
export function bogotaIso(local: string): string {
  return `${local}:00-05:00`
}

export function addHoursLocal(local: string, hours: number): string {
  const shifted = new Date(new Date(bogotaIso(local)).getTime() + hours * 3_600_000)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(shifted)
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${pick('year')}-${pick('month')}-${pick('day')}T${pick('hour')}:${pick('minute')}`
}

export function minutesBetween(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000)
}

export function registrationCount(count: number, own: boolean): string {
  if (own) return count === 1 ? '1 registro tuyo' : `${count} registros tuyos`
  return count === 1 ? '1 registro' : `${count} registros`
}

/** Same cleaning as the site's WhatsApp field formatter. */
export function whatsappHref(raw: string): string | null {
  const stripped = raw.replace(/^\+?0*|(\(0+\))*/g, '')
  const digits = stripped.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}
