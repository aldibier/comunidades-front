import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { loadStories } from '../../api/records'
import { formatDateTime } from '../../ui/format'

export function CommunityPage() {
  const events = useQuery({ queryKey: ['stories', 'event'], queryFn: () => loadStories('event') })
  const pages = useQuery({ queryKey: ['stories', 'page'], queryFn: () => loadStories('page') })
  const articles = useQuery({ queryKey: ['stories', 'article'], queryFn: () => loadStories('article') })

  return (
    <>
      <h1>Avisos</h1>
      <p className="cf-lead">Encuentros y páginas del sitio.</p>
      <section className="cf-section">
        <h2>Eventos</h2>
        {events.data?.map((event) => (
          <Link className="cf-row" key={event.id} to={`/avisos/eventos/${event.id}`}>
            <strong>{event.title}</strong>
            {event.when && <p className="cf-meta">{formatDateTime(event.when)}</p>}
          </Link>
        ))}
        {events.isSuccess && events.data.length === 0 && <p className="cf-empty">No hay eventos publicados.</p>}
      </section>
      <section className="cf-section">
        <h2>Páginas</h2>
        {pages.data?.map((page) => (
          <Link className="cf-row" key={page.id} to={`/avisos/paginas/${page.id}`}>
            <strong>{page.title}</strong>
          </Link>
        ))}
      </section>
      {(articles.data?.length ?? 0) > 0 && (
        <section className="cf-section">
          <h2>Artículos</h2>
          {articles.data?.map((article) => (
            <Link className="cf-row" key={article.id} to={`/avisos/articulos/${article.id}`}>
              <strong>{article.title}</strong>
            </Link>
          ))}
        </section>
      )}
    </>
  )
}
