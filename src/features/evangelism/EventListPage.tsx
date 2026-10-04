import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { loadEvangelismEvents, type EvangelismEvent } from '../../api/records'
import { formatDateTime, registrationCount } from '../../ui/format'

function summary(event: EvangelismEvent): string {
  const manages = event.total !== undefined
  const count = registrationCount(manages ? (event.total ?? 0) : event.mine, !manages)
  const state = manages
    ? `${event.open ? 'Abierto' : 'Cerrado'} · ${count}`
    : event.open ? `Abierto · ${count}` : count
  return [event.ministry?.label, state].filter(Boolean).join(' · ')
}

export function EventListPage() {
  const events = useQuery({ queryKey: ['evangelism-events'], queryFn: loadEvangelismEvents })

  return (
    <>
      <h1>Eventos</h1>
      <p className="cf-lead">Las actividades de evangelismo en las que se abren los registros.</p>
      {events.isLoading && <p className="cf-wait">Cargando eventos…</p>}
      {events.isError && <p className="cf-error">No se pudieron cargar los eventos.</p>}
      {events.isSuccess && events.data.length === 0 && (
        <p className="cf-empty">Todavía no hay un evento con los registros abiertos.</p>
      )}
      <div>
        {events.data?.map((event) => (
          <Link className="cf-row" key={event.id} to={`/evangelismo/eventos/${event.id}`}>
            <strong>{event.title}</strong>
            <p className="cf-meta">
              {[event.when ? formatDateTime(event.when) : '', summary(event)].filter(Boolean).join(' · ')}
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
