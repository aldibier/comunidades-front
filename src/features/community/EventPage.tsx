import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { loadStory } from '../../api/records'
import { formatDateTime } from '../../ui/format'

export function EventPage() {
  const { uuid = '' } = useParams()
  const query = useQuery({ queryKey: ['story', 'event', uuid], queryFn: () => loadStory('event', uuid) })
  if (query.isLoading) return <p className="cf-wait">Cargando el evento…</p>
  if (query.isError || !query.data) return <p className="cf-error">No se pudo abrir el evento.</p>
  const event = query.data
  return (
    <>
      <p><Link to="/avisos">Avisos</Link></p>
      <h1>{event.title}</h1>
      {event.when && <p className="cf-lead">{formatDateTime(event.when)}</p>}
      {event.bodyHtml && <div className="cf-prose" dangerouslySetInnerHTML={{ __html: event.bodyHtml }} />}
    </>
  )
}
