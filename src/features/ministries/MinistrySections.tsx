import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  loadMembers,
  loadMinistries,
  loadMinistryEvents,
  loadPeople,
  loadPublications,
  ownRegistriesPath,
  setMinistryEvangelism,
} from '../../api/records'
import { isLeader, useMe } from '../../app/session'
import { formatDateTime } from '../../ui/format'
import { WritingPage } from '../community/WritingPage'

function useMinistry() {
  const { uuid = '' } = useParams()
  const me = useMe()
  const ministries = useQuery({ queryKey: ['ministries'], queryFn: loadMinistries })
  const ministry = ministries.data?.find((item) => item.id === uuid)
  const members = useQuery({
    queryKey: ['members', uuid],
    queryFn: () => loadMembers(uuid),
    enabled: Boolean(ministry),
  })
  const manages = me.roles.includes('administrator')
    || (members.data?.some((member) => member.admin && member.userId === me.uuid) ?? false)
  return { uuid, me, ministries, ministry, members, manages, leader: isLeader(me) }
}

function Missing({ loading }: { loading: boolean }) {
  if (loading) return <p className="cf-wait">Cargando la comunidad…</p>
  return <p className="cf-empty">No se encontró esta comunidad, o no perteneces a ella.</p>
}

function Frame({ uuid, title, community, children }: { uuid: string; title: string; community: string; children: ReactNode }) {
  return (
    <>
      <p><Link to={`/comunidades/${uuid}`}>Volver</Link></p>
      <h1>{title}</h1>
      <p className="cf-lead">{community}</p>
      {children}
    </>
  )
}

export function MinistryEvangelismPage() {
  const { uuid, me, ministries, ministry, manages, leader } = useMinistry()
  const queryClient = useQueryClient()
  const registries = useQuery({
    queryKey: ['registries', 'ministry', me.uuid],
    queryFn: () => loadPeople(ownRegistriesPath(me.uuid)),
    enabled: Boolean(ministry?.evangelism),
  })
  const toggle = useMutation({
    mutationFn: () => setMinistryEvangelism(uuid, !ministry?.evangelism),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ministries'] })
      await queryClient.invalidateQueries({ queryKey: ['ministry-events', uuid] })
      await queryClient.invalidateQueries({ queryKey: ['evangelism-events'] })
      await queryClient.invalidateQueries({ queryKey: ['evangelism-event'] })
    },
  })

  if (!ministry) return <Missing loading={ministries.isLoading} />

  const failure = toggle.error instanceof ApiError ? toggle.error.message : toggle.isError ? 'No se pudo cambiar el evangelismo.' : ''
  const showActions = ministry.evangelism || manages

  return (
    <Frame uuid={uuid} title="Evangelismo" community={ministry.label}>
      {manages && <p>{ministry.evangelism ? 'Evangelismo activo' : 'Evangelismo inactivo'}</p>}
      {!ministry.evangelism && <p className="cf-empty">Esta comunidad no tiene el evangelismo activo.</p>}
      {showActions && (
        <p className="cf-actions">
          {ministry.evangelism && (
            <Link className="cf-button" to="/evangelismo/nuevo">Registrar a alguien</Link>
          )}
          {ministry.evangelism && leader && <Link to="/evangelismo/todos">Ver todos</Link>}
          {manages && (
            <button
              className={ministry.evangelism ? undefined : 'cf-button'}
              type="button"
              disabled={toggle.isPending}
              onClick={() => toggle.mutate()}
            >
              {ministry.evangelism ? 'Desactivar evangelismo' : 'Activar evangelismo'}
            </button>
          )}
        </p>
      )}
      {failure && <p className="cf-error">{failure}</p>}
      {ministry.evangelism && (
        <section className="cf-section">
          <h2>Personas que registraste</h2>
          {registries.isLoading && <p className="cf-wait">Cargando tu registro…</p>}
          {registries.isError && <p className="cf-error">No se pudo cargar el registro.</p>}
          {registries.isSuccess && registries.data.people.length === 0 && (
            <p className="cf-empty">Cuando registres a alguien, aparecerá aquí.</p>
          )}
          {registries.data?.people.slice(0, 5).map((person) => (
            <Link className="cf-row" key={person.id} to={`/evangelismo/${person.id}`}>
              <strong>{person.name}</strong>
              {person.phone && <p className="cf-meta">{person.phone}</p>}
            </Link>
          ))}
          {(registries.data?.people.length ?? 0) > 0 && (
            <p><Link to="/evangelismo">Ver el registro</Link></p>
          )}
        </section>
      )}
    </Frame>
  )
}

export function MinistryPublicationsPage() {
  const { uuid, ministries, ministry } = useMinistry()
  const publications = useQuery({
    queryKey: ['publications', uuid],
    queryFn: () => loadPublications(uuid),
    enabled: Boolean(ministry),
  })

  if (!ministry) return <Missing loading={ministries.isLoading} />

  return (
    <Frame uuid={uuid} title="Publicaciones" community={ministry.label}>
      {publications.isLoading && <p className="cf-wait">Cargando publicaciones…</p>}
      {publications.isError && <p className="cf-error">No se pudieron cargar las publicaciones.</p>}
      {publications.data?.map((item) => (
        <Link className="cf-row" key={item.id} to={`/comunidades/${uuid}/publicaciones/${item.id}`}>
          <strong>{item.title}</strong>
        </Link>
      ))}
      {publications.isSuccess && publications.data.length === 0 && (
        <p className="cf-empty">Esta comunidad no tiene publicaciones.</p>
      )}
    </Frame>
  )
}

export function MinistryPublicationPage() {
  const { pageId = '' } = useParams()
  const { uuid, ministries, ministry } = useMinistry()
  if (!ministry) return <Missing loading={ministries.isLoading} />
  return (
    <WritingPage
      kind="page"
      id={pageId}
      backTo={`/comunidades/${uuid}/publicaciones`}
      backLabel="Publicaciones"
    />
  )
}

export function MinistryEventsPage() {
  const { uuid, ministries, ministry, manages } = useMinistry()
  const events = useQuery({
    queryKey: ['ministry-events', uuid],
    queryFn: () => loadMinistryEvents(uuid),
    enabled: Boolean(ministry),
  })

  if (!ministry) return <Missing loading={ministries.isLoading} />

  return (
    <Frame uuid={uuid} title="Eventos" community={ministry.label}>
      {manages && (
        <p className="cf-actions">
          <Link className="cf-button" to={`/comunidades/${uuid}/eventos/nuevo`}>Registrar evento</Link>
        </p>
      )}
      {events.isLoading && <p className="cf-wait">Cargando eventos…</p>}
      {events.isError && <p className="cf-error">No se pudieron cargar los eventos.</p>}
      {events.data?.map((event) => (
        <Link className="cf-row" key={event.id} to={`/evangelismo/eventos/${event.id}`}>
          <strong>{event.title}</strong>
          <p className="cf-meta">
            {[
              event.when ? formatDateTime(event.when) : '',
              event.evangelism
                ? (event.open ? 'Registros abiertos' : 'Registros cerrados')
                : 'Informativo',
            ].filter(Boolean).join(' · ')}
          </p>
        </Link>
      ))}
      {events.isSuccess && events.data.length === 0 && <p className="cf-empty">Esta comunidad no tiene eventos.</p>}
    </Frame>
  )
}

export function MinistryMembersPage() {
  const { uuid, ministries, ministry, members } = useMinistry()
  if (!ministry) return <Missing loading={ministries.isLoading} />

  return (
    <Frame uuid={uuid} title="Miembros" community={ministry.label}>
      {members.isLoading && <p className="cf-wait">Cargando miembros…</p>}
      {members.isError && <p className="cf-error">No se pudieron cargar los miembros.</p>}
      {members.data?.map((member) => (
        <p className="cf-row" key={member.id}>
          <strong>{member.name}</strong>
          {member.admin && <span className="cf-meta">Administra la comunidad</span>}
        </p>
      ))}
      {members.isSuccess && members.data.length === 0 && <p className="cf-empty">No hay miembros visibles.</p>}
    </Frame>
  )
}
