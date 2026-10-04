import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { loadStory } from '../../api/records'

export function WritingPage({
  kind,
  id,
  backTo = '/avisos',
  backLabel = 'Avisos',
}: {
  kind: 'page' | 'article'
  id?: string
  backTo?: string
  backLabel?: string
}) {
  const params = useParams()
  const uuid = id || params.uuid || ''
  const query = useQuery({ queryKey: ['story', kind, uuid], queryFn: () => loadStory(kind, uuid) })
  if (query.isLoading) return <p className="cf-wait">Cargando…</p>
  if (query.isError || !query.data) return <p className="cf-error">No se pudo abrir esta página.</p>
  return (
    <>
      <p><Link to={backTo}>{backLabel}</Link></p>
      <h1>{query.data.title}</h1>
      {query.data.bodyHtml && <div className="cf-prose" dangerouslySetInnerHTML={{ __html: query.data.bodyHtml }} />}
    </>
  )
}
