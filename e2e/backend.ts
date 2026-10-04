import type { Page, Route } from '@playwright/test'

export const MEMBER = '11111111-1111-4111-8111-111111111111'
export const LEADER = '22222222-2222-4222-8222-222222222222'
export const CARMEN = '33333333-3333-4333-8333-333333333333'
export const OUTSIDER = '44444444-4444-4444-8444-444444444444'
export const ADULTO = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
export const JOVEN = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
export const CENTRO = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
export const CHIPRE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
export const CUBA = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3'
export const PEREIRA_CENTRO = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4'
export const PEREIRA_OTRO = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5'
export const MANIZALES = '99999999-9999-4999-8999-999999999991'
export const PEREIRA = '99999999-9999-4999-8999-999999999992'
export const ANA = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
export const LUIS = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'
export const MINISTRY = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1'
export const EVENT = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'
export const TERMS = 'ffffffff-ffff-4fff-8fff-fffffffffff1'

const STAGES = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', name: 'Adolescente' },
  { id: ADULTO, name: 'Adulto' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', name: 'Adulto Mayor' },
  { id: JOVEN, name: 'Joven' },
]
const CITIES = [
  { id: MANIZALES, name: 'Manizales' },
  { id: PEREIRA, name: 'Pereira' },
]
const SECTORS = [
  { id: CENTRO, name: 'Centro', cityId: MANIZALES },
  { id: CHIPRE, name: 'Chipre', cityId: MANIZALES },
  { id: PEREIRA_CENTRO, name: 'Centro', cityId: PEREIRA },
  { id: CUBA, name: 'Cuba', cityId: PEREIRA },
  { id: PEREIRA_OTRO, name: 'Otro', cityId: PEREIRA },
]

type Role = 'anonymous' | 'member' | 'leader' | 'outsider'

type Person = {
  id: string
  name: string
  phone: string
  stageId: string
  cityId: string
  sectorId: string
  eventId: string
  prayer: string
  notes: string
  created: string
  authorId: string
}

type Outing = {
  id: string
  title: string
  when: string
  until: string
  open: boolean
  evangelism: boolean
  ministryId: string | null
}

type Profile = { nombres: string; apellidos: string; cellphone: string; birthdate: string }

type Note = { id: string; body: string; created: string; author: string; author_uid: number }

const USERS: Record<string, { name: string; mail: string; roles: string[] }> = {
  [MEMBER]: { name: 'Natalia', mail: 'natalia@example.com', roles: ['authenticated'] },
  [LEADER]: { name: 'Andrés', mail: 'andres@example.com', roles: ['authenticated', 'administrador_de_evangelismo'] },
  [CARMEN]: { name: 'Carmen Díaz', mail: 'carmen@example.com', roles: ['authenticated'] },
  [OUTSIDER]: { name: 'Marta', mail: 'marta@example.com', roles: ['authenticated'] },
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

function termName(list: { id: string; name: string }[], id: string) {
  return list.find((item) => item.id === id)?.name ?? ''
}

export async function installBackend(page: Page, role: Role) {
  const meId = role === 'leader' ? LEADER : role === 'outsider' ? OUTSIDER : MEMBER
  const profile: Profile = {
    nombres: role === 'leader' ? 'Andrés' : '',
    apellidos: '',
    cellphone: role === 'leader' ? '3000000000' : '',
    birthdate: '',
  }
  const people: Person[] = [
    {
      id: ANA,
      name: 'Ana Ruiz',
      phone: '3001234567',
      stageId: ADULTO,
      cityId: MANIZALES,
      sectorId: CENTRO,
      eventId: '',
      prayer: 'Salud de su madre',
      notes: 'Hablamos en el parque',
      created: '2026-08-23T15:00:00+00:00',
      authorId: MEMBER,
    },
    {
      id: LUIS,
      name: 'Luis Gómez',
      phone: '3007654321',
      stageId: JOVEN,
      cityId: PEREIRA,
      sectorId: CUBA,
      eventId: '',
      prayer: '',
      notes: '',
      created: '2026-08-20T15:00:00+00:00',
      authorId: CARMEN,
    },
  ]
  const notes = new Map<string, Note[]>([
    [ANA, [{ id: 'note-1', body: 'Volvió a la iglesia', created: '2026-08-24T18:00:00+00:00', author: 'Natalia', author_uid: 4 }]],
  ])
  const inMinistry = role === 'member' || role === 'leader'
  const ministryState = { evangelism: true }
  let eventSerial = 2
  const outings: Outing[] = [
    {
      id: EVENT,
      title: 'Evangelización en Chipre',
      when: '2025-07-27T14:30:00-05:00',
      until: '2025-07-27T17:30:00-05:00',
      open: true,
      evangelism: true,
      ministryId: MINISTRY,
    },
  ]

  const resource = (person: Person) => ({
    type: 'member_registry--evangelism_registry',
    id: person.id,
    attributes: {
      field_fullname: person.name,
      field_cellphone: person.phone,
      field_peticion_de_oracion: person.prayer,
      field_notes: person.notes,
      created: person.created,
    },
    relationships: {
      uid: { data: { type: 'user--user', id: person.authorId } },
      field_stage_life: { data: { type: 'taxonomy_term--stage_life', id: person.stageId } },
      field_ciudad: person.cityId
        ? { data: { type: 'taxonomy_term--ciudad', id: person.cityId } }
        : { data: null },
      field_sector: person.sectorId
        ? { data: { type: 'taxonomy_term--sectores_manizales', id: person.sectorId } }
        : { data: null },
      field_place: person.eventId
        ? { data: { type: 'node--event', id: person.eventId } }
        : { data: null },
    },
  })

  const includedFor = (rows: Person[]) => {
    const included = []
    const seen = new Set<string>()
    for (const person of rows) {
      if (!seen.has(person.authorId)) {
        seen.add(person.authorId)
        included.push({
          type: 'user--user',
          id: person.authorId,
          attributes: { display_name: USERS[person.authorId].name, name: USERS[person.authorId].name },
        })
      }
      included.push({
        type: 'taxonomy_term--stage_life',
        id: person.stageId,
        attributes: { name: termName(STAGES, person.stageId) },
      })
      if (person.cityId) {
        included.push({
          type: 'taxonomy_term--ciudad',
          id: person.cityId,
          attributes: { name: termName(CITIES, person.cityId) },
        })
      }
      if (person.sectorId) {
        included.push({
          type: 'taxonomy_term--sectores_manizales',
          id: person.sectorId,
          attributes: { name: termName(SECTORS, person.sectorId) },
        })
      }
      if (person.eventId && !seen.has(person.eventId)) {
        seen.add(person.eventId)
        included.push({
          type: 'node--event',
          id: person.eventId,
          attributes: { title: outings.find((item) => item.id === person.eventId)?.title ?? '' },
        })
      }
    }
    return included
  }

  const deny = (route: Route) => json(route, 403, { message: 'No tienes permiso para hacer esto.' })

  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname } = url
    // The screens use Montserrat when the network has it.
    // Tests must not wait on that stylesheet.
    if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
      await route.abort()
      return
    }
    if (!pathname.startsWith('/api') && !pathname.startsWith('/jsonapi') && pathname !== '/session/token') {
      await route.continue()
      return
    }

    if (pathname === '/session/token') {
      await route.fulfill({ status: 200, contentType: 'text/plain', body: 'test-token' })
      return
    }

    if (pathname === '/api/me') {
      if (role === 'anonymous') {
        await deny(route)
        return
      }
      const user = USERS[meId]
      await json(route, 200, { uid: 4, uuid: meId, name: user.name, mail: user.mail, roles: user.roles })
      return
    }

    const comments = pathname.match(/^\/api\/registry\/([^/]+)\/comments$/)
    if (comments) {
      const id = comments[1]
      const person = people.find((item) => item.id === id)
      if (!person || (role === 'member' && person.authorId !== MEMBER)) {
        await deny(route)
        return
      }
      if (request.method() === 'POST') {
        const payload = request.postDataJSON() as { body?: string }
        const list = notes.get(id) ?? []
        list.push({
          id: `note-${list.length + 1}`,
          body: payload.body ?? '',
          created: '2026-08-25T15:00:00+00:00',
          author: USERS[meId].name,
          author_uid: 4,
        })
        notes.set(id, list)
        await route.fulfill({ status: 204, body: '' })
        return
      }
      await json(route, 200, { comments: notes.get(id) ?? [] })
      return
    }

    if (pathname === '/jsonapi/taxonomy_term/stage_life') {
      await json(route, 200, { data: STAGES.map((term) => ({ type: 'taxonomy_term--stage_life', id: term.id, attributes: { name: term.name } })) })
      return
    }
    if (pathname === '/jsonapi/taxonomy_term/ciudad') {
      await json(route, 200, {
        data: CITIES.map((term) => ({ type: 'taxonomy_term--ciudad', id: term.id, attributes: { name: term.name } })),
      })
      return
    }
    if (pathname === '/jsonapi/taxonomy_term/sectores_manizales') {
      await json(route, 200, {
        data: SECTORS.map((term) => ({
          type: 'taxonomy_term--sectores_manizales',
          id: term.id,
          attributes: { name: term.name },
          relationships: {
            field_ciudad: { data: { type: 'taxonomy_term--ciudad', id: term.cityId } },
          },
        })),
        included: CITIES.map((term) => ({ type: 'taxonomy_term--ciudad', id: term.id, attributes: { name: term.name } })),
      })
      return
    }

    const registry = pathname.match(/^\/jsonapi\/member_registry\/evangelism_registry(?:\/([^/]+))?$/)
    if (registry) {
      const id = registry[1]
      if (!id && request.method() === 'GET') {
        const uid = url.searchParams.get('filter[uid.id]')
        const stage = url.searchParams.get('filter[field_stage_life.id]')
        const city = url.searchParams.get('filter[field_ciudad.id]')
        const sector = url.searchParams.get('filter[field_sector.id]')
        const event = url.searchParams.get('filter[field_place.id]')
        const q = (url.searchParams.get('filter[search-name][condition][value]') ?? '').trim().toLowerCase()
        const rows = people.filter((person) => {
          if (uid && person.authorId !== uid) return false
          if (stage && person.stageId !== stage) return false
          if (city && person.cityId !== city) return false
          if (sector && person.sectorId !== sector) return false
          if (event && person.eventId !== event) return false
          if (q && !person.name.toLowerCase().includes(q) && !person.phone.toLowerCase().includes(q)) return false
          return true
        })
        await json(route, 200, { data: rows.map(resource), included: includedFor(rows) })
        return
      }
      if (!id && request.method() === 'POST') {
        const payload = request.postDataJSON() as {
          data: {
            attributes: Record<string, string>
            relationships: {
              field_stage_life: { data: { id: string } }
              field_ciudad: { data: { id: string } | null }
              field_sector: { data: { id: string } | null }
              field_place?: { data: { id: string } | null }
            }
          }
        }
        const created: Person = {
          id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
          name: payload.data.attributes.field_fullname,
          phone: payload.data.attributes.field_cellphone,
          prayer: payload.data.attributes.field_peticion_de_oracion ?? '',
          notes: payload.data.attributes.field_notes ?? '',
          stageId: payload.data.relationships.field_stage_life.data.id,
          cityId: payload.data.relationships.field_ciudad.data?.id ?? '',
          sectorId: payload.data.relationships.field_sector.data?.id ?? '',
          eventId: payload.data.relationships.field_place?.data?.id ?? '',
          created: '2026-08-26T15:00:00+00:00',
          authorId: meId,
        }
        people.unshift(created)
        await json(route, 201, { data: { id: created.id } })
        return
      }
      const person = people.find((item) => item.id === id)
      if (!person) {
        await json(route, 404, { errors: [{ detail: 'No se encontró.' }] })
        return
      }
      if (role !== 'leader' && person.authorId !== meId) {
        await deny(route)
        return
      }
      if (request.method() === 'DELETE') {
        people.splice(people.indexOf(person), 1)
        await route.fulfill({ status: 204, body: '' })
        return
      }
      if (request.method() === 'PATCH') {
        const payload = request.postDataJSON() as {
          data: {
            attributes: Record<string, string>
            relationships: {
              field_stage_life: { data: { id: string } }
              field_ciudad: { data: { id: string } | null }
              field_sector: { data: { id: string } | null }
              field_place?: { data: { id: string } | null }
            }
          }
        }
        person.name = payload.data.attributes.field_fullname
        person.phone = payload.data.attributes.field_cellphone
        person.prayer = payload.data.attributes.field_peticion_de_oracion ?? ''
        person.notes = payload.data.attributes.field_notes ?? ''
        person.stageId = payload.data.relationships.field_stage_life.data.id
        person.cityId = payload.data.relationships.field_ciudad.data?.id ?? ''
        person.sectorId = payload.data.relationships.field_sector.data?.id ?? ''
        person.eventId = payload.data.relationships.field_place?.data?.id ?? ''
        await json(route, 200, { data: resource(person), included: includedFor([person]) })
        return
      }
      await json(route, 200, { data: resource(person), included: includedFor([person]) })
      return
    }

    const user = pathname.match(/^\/jsonapi\/user\/user(?:\/([^/]+))?$/)
    if (user) {
      const id = user[1]
      if (!id) {
        const data = Object.entries(USERS).map(([userId, account]) => ({
          type: 'user--user',
          id: userId,
          attributes: { display_name: account.name, name: account.name },
        }))
        data.push({ type: 'user--user', id: '00000000-0000-4000-8000-000000000000', attributes: { display_name: 'Anonymous', name: 'Anonymous' } })
        await json(route, 200, { data })
        return
      }
      if (request.method() === 'PATCH' && id === meId) {
        const attributes = (request.postDataJSON() as { data: { attributes: Record<string, string | null> } }).data.attributes
        profile.nombres = attributes.field_nombres ?? ''
        profile.apellidos = attributes.field_apellidos ?? ''
        profile.cellphone = attributes.field_cellphone ?? ''
        profile.birthdate = (attributes.field_fecha_de_nacimiento ?? '').slice(0, 10)
        await route.fulfill({ status: 204, body: '' })
        return
      }
      if (id !== meId) {
        await deny(route)
        return
      }
      await json(route, 200, {
        data: {
          type: 'user--user',
          id,
          attributes: {
            display_name: USERS[id].name,
            name: USERS[id].name,
            mail: USERS[id].mail,
            field_nombres: profile.nombres,
            field_apellidos: profile.apellidos,
            field_cellphone: profile.cellphone,
            field_fecha_de_nacimiento: profile.birthdate || null,
          },
        },
      })
      return
    }

    if (pathname === '/jsonapi/group/ministry') {
      const data = inMinistry
        ? [{
            type: 'group--ministry',
            id: MINISTRY,
            attributes: {
              label: 'Gozo en el cielo',
              field_evangelismo: ministryState.evangelism,
              field_description: { processed: '<p>Un espacio para compartir.</p>' },
            },
            relationships: { field_image_logo: { data: null } },
          }]
        : []
      await json(route, 200, { data })
      return
    }

    if (pathname.includes('ministry-group_node-page')) {
      await json(route, 200, { data: [] })
      return
    }

    if (pathname.startsWith('/jsonapi/group_relationship/')) {
      const rows = inMinistry
        ? [{ id: 'membership-1', userId: MEMBER, name: 'Natalia', admin: false }]
        : []
      if (role === 'leader') {
        rows.push({ id: 'membership-2', userId: LEADER, name: 'Andrés', admin: true })
      }
      await json(route, 200, {
        data: rows.map((row) => ({
          type: 'group_relationship--ministry-group_membership',
          id: row.id,
          attributes: {},
          relationships: {
            gid: { data: { type: 'group--ministry', id: MINISTRY } },
            entity_id: { data: { type: 'user--user', id: row.userId } },
            group_roles: {
              data: row.admin
                ? [{ type: 'group_role--group_role', id: 'ministry-admin', meta: { drupal_internal__target_id: 'ministry-admin' } }]
                : [],
            },
          },
        })),
        included: rows.map((row) => ({
          type: 'user--user',
          id: row.userId,
          attributes: { display_name: row.name, name: row.name },
        })),
      })
      return
    }

    const leader = role === 'leader'
    const payloadFor = (outing: Outing) => {
      const rows = people.filter((person) => person.eventId === outing.id)
      const mine = rows.filter((person) => person.authorId === meId).length
      const item: {
        id: string
        title: string
        when: string
        until: string
        open: boolean
        evangelism: boolean
        ministry: { id: string; label: string; evangelism: boolean } | null
        mine: number
        total?: number
      } = {
        id: outing.id,
        title: outing.title,
        when: outing.when,
        until: outing.until,
        open: outing.open,
        evangelism: outing.evangelism,
        ministry: outing.ministryId
          ? { id: outing.ministryId, label: 'Gozo en el cielo', evangelism: ministryState.evangelism }
          : null,
        mine,
      }
      if (leader) item.total = rows.length
      return item
    }

    const ministryApi = pathname.match(/^\/api\/ministry\/([^/]+)\/(events|evangelism)$/)
    if (ministryApi) {
      if (role === 'anonymous' || !inMinistry) {
        await deny(route)
        return
      }
      const ministryId = ministryApi[1]
      const action = ministryApi[2]
      if (ministryId !== MINISTRY) {
        await json(route, 404, { message: 'No se encontró.' })
        return
      }
      if (action === 'evangelism') {
        if (request.method() !== 'POST' || role !== 'leader') {
          await deny(route)
          return
        }
        const payload = request.postDataJSON() as { enabled?: boolean }
        ministryState.evangelism = payload.enabled === true
        await json(route, 200, { enabled: ministryState.evangelism })
        return
      }
      if (request.method() === 'POST') {
        if (role !== 'leader') {
          await deny(route)
          return
        }
        const payload = request.postDataJSON() as {
          title?: string
          when?: string
          until?: string
          evangelism?: boolean
        }
        if (!payload.title?.trim() || !payload.when || !payload.until) {
          await json(route, 422, { message: 'Escribe el título y la fecha.' })
          return
        }
        if (payload.evangelism && !ministryState.evangelism) {
          await json(route, 422, { message: 'Esta comunidad no tiene el evangelismo activo.' })
          return
        }
        const created: Outing = {
          id: `eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee${eventSerial}`,
          title: payload.title.trim(),
          when: payload.when,
          until: payload.until,
          open: payload.evangelism === true,
          evangelism: payload.evangelism === true,
          ministryId: MINISTRY,
        }
        eventSerial += 1
        outings.unshift(created)
        await json(route, 201, payloadFor(created))
        return
      }
      await json(route, 200, { events: outings.filter((outing) => outing.ministryId === MINISTRY).map(payloadFor) })
      return
    }

    const evangelismEvent = pathname.match(/^\/api\/evangelism\/events(?:\/([^/]+))?$/)
    if (evangelismEvent) {
      if (role === 'anonymous') {
        await deny(route)
        return
      }
      const id = evangelismEvent[1]
      if (request.method() === 'PATCH') {
        if (role !== 'leader') {
          await deny(route)
          return
        }
        const outing = outings.find((item) => item.id === id)
        if (!outing) {
          await json(route, 404, { message: 'No se encontró.' })
          return
        }
        const body = request.postDataJSON() as { open?: boolean; evangelism?: boolean }
        const nextEvangelism = typeof body.evangelism === 'boolean' ? body.evangelism : outing.evangelism
        const nextOpen = typeof body.open === 'boolean' ? body.open : outing.open
        if (nextOpen && !nextEvangelism) {
          await json(route, 422, { message: 'Solo una actividad de evangelismo abre registros.' })
          return
        }
        if (nextEvangelism && !outing.evangelism && !ministryState.evangelism) {
          await json(route, 422, { message: 'Esta comunidad no tiene el evangelismo activo.' })
          return
        }
        outing.evangelism = nextEvangelism
        outing.open = nextOpen
        await json(route, 200, payloadFor(outing))
        return
      }
      if (!id) {
        const visible = outings.filter((outing) => {
          if (!outing.evangelism) return false
          const rows = people.filter((person) => person.eventId === outing.id)
          const mine = rows.filter((person) => person.authorId === meId).length
          return leader ? outing.open || rows.length > 0 : outing.open || mine > 0
        })
        await json(route, 200, { events: visible.map(payloadFor) })
        return
      }
      const outing = outings.find((item) => item.id === id)
      if (!outing) {
        await json(route, 404, { message: 'No se encontró.' })
        return
      }
      await json(route, 200, payloadFor(outing))
      return
    }

    const node = pathname.match(/^\/jsonapi\/node\/(event|page|article)(?:\/([^/]+))?$/)
    if (node) {
      const [, bundle, id] = node
      if (bundle === 'event' && request.method() === 'POST' && !id) {
        if (role !== 'leader') {
          await deny(route)
          return
        }
        const payload = request.postDataJSON() as {
          data: { attributes: { title?: string; field_registro_abierto?: boolean; field_when?: { value?: string; end_value?: string }[] } }
        }
        const when = payload.data.attributes.field_when?.[0]
        const created: Outing = {
          id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
          title: payload.data.attributes.title ?? '',
          when: when?.value ?? '',
          until: when?.end_value ?? '',
          open: payload.data.attributes.field_registro_abierto !== false,
          evangelism: true,
          ministryId: MINISTRY,
        }
        outings.unshift(created)
        await json(route, 201, { data: { type: 'node--event', id: created.id } })
        return
      }
      if (bundle === 'event' && request.method() === 'PATCH' && id) {
        if (role !== 'leader') {
          await deny(route)
          return
        }
        const outing = outings.find((item) => item.id === id)
        if (!outing) {
          await json(route, 404, { message: 'No se encontró.' })
          return
        }
        const payload = request.postDataJSON() as { data: { attributes: { field_registro_abierto?: boolean } } }
        if (typeof payload.data.attributes.field_registro_abierto === 'boolean') {
          outing.open = payload.data.attributes.field_registro_abierto
        }
        await json(route, 200, { data: { type: 'node--event', id } })
        return
      }
      const events = [{
        type: 'node--event',
        id: EVENT,
        attributes: {
          title: 'Evangelización en Chipre',
          body: { processed: '<p>Nos vemos en el parque.</p>' },
          field_when: [{ value: '2025-07-27T19:30:00+00:00', end_value: '2025-07-27T22:30:00+00:00' }],
        },
      }]
      const pages = [{
        type: 'node--page',
        id: TERMS,
        attributes: {
          title: 'Términos de servicio',
          body: { processed: '<p>El uso del registro.</p>' },
        },
      }]
      const rows = bundle === 'event' ? events : bundle === 'page' ? pages : []
      if (!id) {
        await json(route, 200, { data: rows })
        return
      }
      const found = rows.find((item) => item.id === id)
      if (!found) {
        await json(route, 404, { errors: [{ detail: 'No se encontró.' }] })
        return
      }
      await json(route, 200, { data: found })
      return
    }

    await json(route, 404, { errors: [{ detail: `Sin simulación para ${pathname}` }] })
  })
}
