import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { loadMinistries } from '../../api/records'
import { MinistryHeader } from './MinistryCard'

const DOORS = [
  { id: 'evangelismo', title: 'Evangelismo', active: 'Registrar personas', inactive: 'Inactivo' },
  { id: 'publicaciones', title: 'Publicaciones', meta: 'Páginas de la comunidad' },
  { id: 'eventos', title: 'Eventos', meta: 'Encuentros' },
  { id: 'miembros', title: 'Miembros', meta: 'Personas de la comunidad' },
] as const

export function MinistryDetailPage() {
  const { uuid = '' } = useParams()
  const ministries = useQuery({ queryKey: ['ministries'], queryFn: loadMinistries })
  const ministry = ministries.data?.find((item) => item.id === uuid)

  if (ministries.isLoading) return <p className="cf-wait">Cargando la comunidad…</p>
  if (!ministry) return <p className="cf-empty">No se encontró esta comunidad, o no perteneces a ella.</p>

  return (
    <>
      <p><Link to="/comunidades">Comunidades</Link></p>
      <MinistryHeader ministry={ministry} />
      <nav className="cf-doors" aria-label="Espacios">
        {DOORS.map((door) => (
          <Link className="cf-door" key={door.id} to={`/comunidades/${uuid}/${door.id}`}>
            <span>
              <strong>{door.title}</strong>
              <span className="cf-meta">
                {'meta' in door ? door.meta : ministry.evangelism ? door.active : door.inactive}
              </span>
            </span>
            <span className="cf-door-go">Entrar</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
