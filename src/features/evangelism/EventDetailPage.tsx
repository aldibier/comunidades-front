import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { eventRegistriesPath, loadEvangelismEvent, loadPeople, setEventState } from '../../api/records'
import { useMe } from '../../app/session'
import { formatDateTime, registrationCount } from '../../ui/format'

export function EventDetailPage() {
  const { uuid = '' } = useParams()
  const me = useMe()
  const queryClient = useQueryClient()
  const event = useQuery({ queryKey: ['evangelism-event', uuid], queryFn: () => loadEvangelismEvent(uuid) })
  const manages = event.data?.total !== undefined
  const people = useInfiniteQuery({
    queryKey: ['registries', 'event', uuid, manages ? 'all' : me.uuid],
    initialPageParam: eventRegistriesPath(uuid, manages ? undefined : me.uuid),
    queryFn: ({ pageParam }) => loadPeople(pageParam),
    getNextPageParam: (last) => last.next ?? undefined,
    enabled: event.isSuccess && Boolean(event.data?.evangelism),
  })
  const change = useMutation({
    mutationFn: (patch: { open?: boolean; evangelism?: boolean }) => setEventState(uuid, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['evangelism-events'] })
      await queryClient.invalidateQueries({ queryKey: ['evangelism-event', uuid] })
      await queryClient.invalidateQueries({ queryKey: ['ministry-events'] })
    },
  })

  if (event.isLoading) return <p className="cf-wait">Cargando el evento…</p>
  if (event.isError) {
    const message = event.error instanceof ApiError ? event.error.message : 'No se pudo abrir este evento.'
    return <p className="cf-error">{message}</p>
  }
  if (!event.data) return null
  const current = event.data
  const rows = people.data?.pages.flatMap((page) => page.people) ?? []
  const count = registrationCount(manages ? (current.total ?? 0) : current.mine, !manages)
  const when = [current.when ? formatDateTime(current.when) : '', current.until ? formatDateTime(current.until) : '']
    .filter(Boolean)
    .join(' hasta ')
  const failure = change.error instanceof ApiError ? change.error.message : change.isError ? 'No se pudo cambiar el evento.' : ''

  return (
    <>
      <h1>{current.title}</h1>
      {current.ministry && <p><Link to={`/comunidades/${current.ministry.id}`}>{current.ministry.label}</Link></p>}
      {when && <p className="cf-meta">{when}</p>}
      {current.evangelism ? (
        <>
          <p>{current.open ? 'Registros abiertos' : 'Registros cerrados'}</p>
          <p className="cf-lead">{count}</p>
          <p className="cf-actions">
            {current.open && (
              <Link className="cf-button" to={`/evangelismo/nuevo?evento=${current.id}`}>Registrar a alguien</Link>
            )}
            {manages && (
              <button
                className={current.open ? undefined : 'cf-button'}
                type="button"
                disabled={change.isPending}
                onClick={() => change.mutate({ open: !current.open })}
              >
                {current.open ? 'Cerrar registros' : 'Abrir registros'}
              </button>
            )}
          </p>
          {failure && <p className="cf-error">{failure}</p>}
          <section className="cf-section">
            <h2>Registros</h2>
            {people.isLoading && <p className="cf-wait">Cargando registros…</p>}
            {people.isError && <p className="cf-error">No se pudieron cargar los registros.</p>}
            {people.isSuccess && rows.length === 0 && (
              <p className="cf-empty">
                {manages ? 'Todavía no hay registros en este evento.' : 'Todavía no tienes registros en este evento.'}
              </p>
            )}
            {rows.map((person) => {
              const detail = [manages ? person.author : '', person.phone].filter(Boolean).join(' · ')
              return (
                <Link className="cf-row" key={person.id} to={`/evangelismo/${person.id}`}>
                  <strong>{person.name}</strong>
                  {detail && <p className="cf-meta">{detail}</p>}
                </Link>
              )
            })}
            {people.hasNextPage && (
              <p className="cf-actions">
                <button className="cf-button" type="button" disabled={people.isFetchingNextPage} onClick={() => people.fetchNextPage()}>
                  Cargar más
                </button>
              </p>
            )}
          </section>
        </>
      ) : (
        <>
          <p>Evento informativo</p>
          <p className="cf-lead">No abre registros de evangelizados.</p>
          {manages && current.ministry?.evangelism && (
            <p className="cf-actions">
              <button className="cf-button" type="button" disabled={change.isPending} onClick={() => change.mutate({ open: true, evangelism: true })}>
                Abrir registros
              </button>
            </p>
          )}
          {failure && <p className="cf-error">{failure}</p>}
        </>
      )}
    </>
  )
}
