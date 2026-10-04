import { apiGet } from './client'

export type ResourceIdentifier = {
  type: string
  id: string
  meta?: { drupal_internal__target_id?: string }
}

export type Resource = {
  type: string
  id: string
  attributes: Record<string, unknown>
  relationships?: Record<string, { data: ResourceIdentifier | ResourceIdentifier[] | null }>
}

export type Collection = {
  data: Resource[]
  included: Map<string, Resource>
  next: string | null
}

type CollectionBody = {
  data: Resource[]
  included?: Resource[]
  links?: { next?: { href?: string } }
}

function key(type: string, id: string) {
  return `${type}:${id}`
}

export function sameOrigin(href: string): string {
  const url = new URL(href, window.location.origin)
  return `${url.pathname}${url.search}`
}

export async function getCollection(path: string): Promise<Collection> {
  const body = await apiGet<CollectionBody>(sameOrigin(path))
  const included = new Map<string, Resource>()
  for (const item of body.included ?? []) included.set(key(item.type, item.id), item)
  const next = body.links?.next?.href
  return {
    data: body.data,
    included,
    next: next ? sameOrigin(next) : null,
  }
}

export async function getResource(path: string): Promise<{ data: Resource; included: Map<string, Resource> }> {
  const body = await apiGet<{ data: Resource; included?: Resource[] }>(path)
  const included = new Map<string, Resource>()
  for (const item of body.included ?? []) included.set(key(item.type, item.id), item)
  included.set(key(body.data.type, body.data.id), body.data)
  return { data: body.data, included }
}

export function relOne(resource: Resource, name: string, included: Map<string, Resource>): Resource | undefined {
  const data = resource.relationships?.[name]?.data
  if (!data || Array.isArray(data)) return undefined
  return included.get(key(data.type, data.id))
}

export function relIds(resource: Resource, name: string): ResourceIdentifier[] {
  const data = resource.relationships?.[name]?.data
  if (!data) return []
  return Array.isArray(data) ? data : [data]
}

export function plain(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'value' in value) {
    const inner = (value as { value?: unknown }).value
    return typeof inner === 'string' ? inner : ''
  }
  return ''
}

export function processedHtml(value: unknown): string | null {
  if (value && typeof value === 'object' && 'processed' in value) {
    const html = (value as { processed?: unknown }).processed
    return typeof html === 'string' && html.trim() ? html : null
  }
  return null
}

export function displayName(user: Resource | undefined): string {
  if (!user) return ''
  const display = user.attributes.display_name
  if (typeof display === 'string' && display.trim()) return display
  const name = user.attributes.name
  return typeof name === 'string' ? name : ''
}
