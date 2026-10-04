import { apiGet, apiSend } from './client'
import {
  displayName,
  getCollection,
  getResource,
  plain,
  processedHtml,
  relIds,
  relOne,
  type Resource,
} from './json'

const REGISTRY = 'member_registry--evangelism_registry'
const INCLUDE = 'include=uid,field_stage_life,field_sector,field_ciudad,field_place'

export type Person = {
  id: string
  name: string
  phone: string
  stage: string
  city: string
  sector: string
  event: string
  prayer: string
  notes: string
  created: string
  author: string
  authorId: string
  stageId: string
  cityId: string
  sectorId: string
  eventId: string
}

export type EventMinistry = {
  id: string
  label: string
  evangelism: boolean
}

export type EvangelismEvent = {
  id: string
  title: string
  when: string
  until: string
  open: boolean
  evangelism: boolean
  ministry: EventMinistry | null
  mine: number
  total?: number
}

export type Term = { id: string; name: string; cityId?: string }

export type Ministry = {
  id: string
  label: string
  descriptionHtml: string | null
  logoUrl: string | null
  evangelism: boolean
}

export type MinistryMember = { id: string; name: string; admin: boolean; userId: string }

export type Publication = { id: string; title: string }

function flag(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export type Note = {
  id: string
  body: string
  created: string
  author: string
  authorUid: number
}

export type Profile = {
  nombres: string
  apellidos: string
  cellphone: string
  birthdate: string
}

export type RegistryInput = {
  name: string
  phone: string
  stageId: string
  cityId: string
  sectorId: string
  eventId: string
  prayer: string
  notes: string
}

function registryQuery(options: { uid?: string; stage?: string; city?: string; sector?: string; event?: string; q?: string; limit?: number }) {
  const params = new URLSearchParams()
  params.set('page[limit]', String(options.limit ?? 25))
  params.set('sort', '-created')
  params.set('include', 'uid,field_stage_life,field_sector,field_ciudad,field_place')
  if (options.uid) params.set('filter[uid.id]', options.uid)
  if (options.stage) params.set('filter[field_stage_life.id]', options.stage)
  if (options.city) params.set('filter[field_ciudad.id]', options.city)
  if (options.sector) params.set('filter[field_sector.id]', options.sector)
  if (options.event) params.set('filter[field_place.id]', options.event)
  const q = options.q?.trim()
  if (q) {
    params.set('filter[search-or][group][conjunction]', 'OR')
    params.set('filter[search-name][condition][path]', 'field_fullname')
    params.set('filter[search-name][condition][operator]', 'CONTAINS')
    params.set('filter[search-name][condition][value]', q)
    params.set('filter[search-name][condition][memberOf]', 'search-or')
    params.set('filter[search-phone][condition][path]', 'field_cellphone')
    params.set('filter[search-phone][condition][operator]', 'CONTAINS')
    params.set('filter[search-phone][condition][value]', q)
    params.set('filter[search-phone][condition][memberOf]', 'search-or')
  }
  return `/jsonapi/member_registry/evangelism_registry?${params}`
}

export function eventRegistriesPath(eventId: string, uid?: string) {
  return registryQuery({ uid, event: eventId, limit: 25 })
}

export function ownRegistriesPath(uid: string, q = '') {
  return registryQuery({ uid, q, limit: 25 })
}

export function allRegistriesPath(filters: { stage?: string; city?: string; sector?: string; author?: string; q?: string }) {
  return registryQuery({
    uid: filters.author || undefined,
    stage: filters.stage || undefined,
    city: filters.city || undefined,
    sector: filters.sector || undefined,
    q: filters.q,
    limit: 25,
  })
}

export function toPerson(resource: Resource, included: Map<string, Resource>): Person {
  const stage = relOne(resource, 'field_stage_life', included)
  const sector = relOne(resource, 'field_sector', included)
  const city = relOne(resource, 'field_ciudad', included)
  const event = relOne(resource, 'field_place', included)
  const author = relOne(resource, 'uid', included)
  return {
    id: resource.id,
    name: plain(resource.attributes.field_fullname),
    phone: plain(resource.attributes.field_cellphone),
    stage: plain(stage?.attributes.name),
    city: plain(city?.attributes.name),
    sector: plain(sector?.attributes.name),
    event: plain(event?.attributes.title),
    prayer: plain(resource.attributes.field_peticion_de_oracion),
    notes: plain(resource.attributes.field_notes),
    created: plain(resource.attributes.created),
    author: displayName(author),
    authorId: author?.id ?? '',
    stageId: stage?.id ?? '',
    cityId: city?.id ?? '',
    sectorId: sector?.id ?? '',
    eventId: event?.id ?? '',
  }
}

export async function loadPeople(path: string) {
  const page = await getCollection(path)
  return {
    people: page.data.map((item) => toPerson(item, page.included)),
    next: page.next,
  }
}

export async function loadPerson(uuid: string) {
  const { data, included } = await getResource(
    `/jsonapi/member_registry/evangelism_registry/${uuid}?${INCLUDE}`,
  )
  return toPerson(data, included)
}

function registryBody(input: RegistryInput, id?: string) {
  const relationships: Record<string, { data: { type: string; id: string } | null }> = {
    field_stage_life: {
      data: { type: 'taxonomy_term--stage_life', id: input.stageId },
    },
    field_ciudad: input.cityId
      ? { data: { type: 'taxonomy_term--ciudad', id: input.cityId } }
      : { data: null },
    field_sector: input.sectorId
      ? { data: { type: 'taxonomy_term--sectores_manizales', id: input.sectorId } }
      : { data: null },
    field_place: input.eventId
      ? { data: { type: 'node--event', id: input.eventId } }
      : { data: null },
  }
  return {
    data: {
      type: REGISTRY,
      ...(id ? { id } : {}),
      attributes: {
        field_fullname: input.name,
        field_cellphone: input.phone,
        field_peticion_de_oracion: input.prayer,
        field_notes: input.notes,
      },
      relationships,
    },
  }
}

export async function createRegistry(input: RegistryInput) {
  const created = await apiSend<{ data: { id: string } }>(
    '/jsonapi/member_registry/evangelism_registry',
    'POST',
    registryBody(input),
  )
  return created.data.id
}

export async function updateRegistry(id: string, input: RegistryInput) {
  await apiSend(`/jsonapi/member_registry/evangelism_registry/${id}`, 'PATCH', registryBody(input, id))
}

export async function deleteRegistry(id: string) {
  await apiSend(`/jsonapi/member_registry/evangelism_registry/${id}`, 'DELETE')
}

export async function loadTerms(vocabulary: 'stage_life' | 'sectores_manizales' | 'ciudad'): Promise<Term[]> {
  const page = await getCollection(`/jsonapi/taxonomy_term/${vocabulary}?sort=name&page[limit]=50`)
  return page.data.map((term) => ({ id: term.id, name: plain(term.attributes.name) }))
}

export async function loadSectors(): Promise<Term[]> {
  const page = await getCollection('/jsonapi/taxonomy_term/sectores_manizales?include=field_ciudad&sort=name&page[limit]=50')
  return page.data.map((term) => {
    const city = relOne(term, 'field_ciudad', page.included)
    return { id: term.id, name: plain(term.attributes.name), cityId: city?.id ?? '' }
  })
}

export async function loadNotes(uuid: string): Promise<Note[]> {
  const body = await apiGet<{
    comments: { id: string; body: string; created: string; author: string; author_uid: number }[]
  }>(`/api/registry/${uuid}/comments`)
  return body.comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    created: comment.created,
    author: comment.author,
    authorUid: comment.author_uid,
  }))
}

export async function addNote(uuid: string, body: string) {
  await apiSend(`/api/registry/${uuid}/comments`, 'POST', { body }, false)
}

export async function loadMinistries(): Promise<Ministry[]> {
  const page = await getCollection(
    '/jsonapi/group/ministry?include=field_image_logo.field_media_image&page[limit]=20',
  )
  return page.data.map((group) => {
    const media = relOne(group, 'field_image_logo', page.included)
    const file = media ? relOne(media, 'field_media_image', page.included) : undefined
    const uri = file?.attributes.uri
    const logoUrl =
      uri && typeof uri === 'object' && 'url' in uri && typeof uri.url === 'string' ? uri.url : null
    return {
      id: group.id,
      label: plain(group.attributes.label),
      descriptionHtml: processedHtml(group.attributes.field_description),
      logoUrl,
      evangelism: flag(group.attributes.field_evangelismo),
    }
  })
}

export async function loadPublications(groupId: string): Promise<Publication[]> {
  const page = await getCollection(
    '/jsonapi/group_relationship/ministry-group_node-page?include=entity_id&page[limit]=50',
  )
  return page.data.flatMap((relation) => {
    const gidData = relation.relationships?.gid?.data
    const gid = gidData && !Array.isArray(gidData) ? gidData.id : ''
    if (gid !== groupId) return []
    const node = relOne(relation, 'entity_id', page.included)
    const nodeData = relation.relationships?.entity_id?.data
    const id = node?.id || (nodeData && !Array.isArray(nodeData) ? nodeData.id : '')
    if (!id) return []
    return [{ id, title: plain(node?.attributes.title) || 'Publicación' }]
  })
}

export async function loadMembers(groupId: string): Promise<MinistryMember[]> {
  const page = await getCollection(
    '/jsonapi/group_relationship/ministry-group_membership?include=entity_id&page[limit]=100',
  )
  return page.data.flatMap((membership) => {
    const gidData = membership.relationships?.gid?.data
    const gid = gidData && !Array.isArray(gidData) ? gidData.id : ''
    if (gid !== groupId) return []
    const user = relOne(membership, 'entity_id', page.included)
    const userData = membership.relationships?.entity_id?.data
    const userId = userData && !Array.isArray(userData) ? userData.id : ''
    const admin = relIds(membership, 'group_roles').some(
      (role) => role.meta?.drupal_internal__target_id === 'ministry-admin',
    )
    return [{ id: membership.id, name: displayName(user) || 'Miembro', admin, userId }]
  })
}

export async function loadProfile(uuid: string): Promise<Profile> {
  const { data } = await getResource(`/jsonapi/user/user/${uuid}`)
  const birth = data.attributes.field_fecha_de_nacimiento
  return {
    nombres: plain(data.attributes.field_nombres),
    apellidos: plain(data.attributes.field_apellidos),
    cellphone: plain(data.attributes.field_cellphone),
    birthdate: typeof birth === 'string' ? birth.slice(0, 10) : '',
  }
}

export async function saveProfile(uuid: string, profile: Profile) {
  await apiSend(`/jsonapi/user/user/${uuid}`, 'PATCH', {
    data: {
      type: 'user--user',
      id: uuid,
      attributes: {
        field_nombres: profile.nombres,
        field_apellidos: profile.apellidos,
        field_cellphone: profile.cellphone,
        field_fecha_de_nacimiento: profile.birthdate || null,
      },
    },
  })
}

export type Story = {
  id: string
  title: string
  bodyHtml: string | null
  when: string
  until: string
}

function toStory(resource: Resource): Story {
  const when = resource.attributes.field_when
  const first = Array.isArray(when) ? (when[0] as { value?: string; end_value?: string } | undefined) : undefined
  return {
    id: resource.id,
    title: plain(resource.attributes.title),
    bodyHtml: processedHtml(resource.attributes.body),
    when: first?.value ?? '',
    until: first?.end_value ?? '',
  }
}

export async function loadEvangelismEvents(): Promise<EvangelismEvent[]> {
  const body = await apiGet<{ events: EvangelismEvent[] }>('/api/evangelism/events')
  return body.events
}

export async function loadEvangelismEvent(id: string): Promise<EvangelismEvent> {
  return apiGet<EvangelismEvent>(`/api/evangelism/events/${id}`)
}

export async function loadMinistryEvents(ministryId: string): Promise<EvangelismEvent[]> {
  const body = await apiGet<{ events: EvangelismEvent[] }>(`/api/ministry/${ministryId}/events`)
  return body.events
}

export async function createMinistryEvent(
  ministryId: string,
  input: { title: string; when: string; until: string; duration: number; evangelism: boolean },
) {
  const created = await apiSend<EvangelismEvent>(`/api/ministry/${ministryId}/events`, 'POST', input, false)
  return created.id
}

export async function setEventState(id: string, patch: { open?: boolean; evangelism?: boolean }) {
  await apiSend(`/api/evangelism/events/${id}`, 'PATCH', patch, false)
}

export async function setMinistryEvangelism(ministryId: string, enabled: boolean) {
  await apiSend(`/api/ministry/${ministryId}/evangelism`, 'POST', { enabled }, false)
}

export async function loadStories(bundle: 'event' | 'page' | 'article'): Promise<Story[]> {
  const page = await getCollection(`/jsonapi/node/${bundle}?sort=-created&page[limit]=20`)
  return page.data.map(toStory)
}

export async function loadStory(bundle: 'event' | 'page' | 'article', uuid: string): Promise<Story> {
  const { data } = await getResource(`/jsonapi/node/${bundle}/${uuid}`)
  return toStory(data)
}

export async function loadAuthors(): Promise<Term[]> {
  const page = await getCollection('/jsonapi/user/user?sort=name&page[limit]=100')
  return page.data
    .map((user) => ({ id: user.id, name: displayName(user) }))
    .filter((user) => user.name && user.name !== 'Anonymous')
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}
