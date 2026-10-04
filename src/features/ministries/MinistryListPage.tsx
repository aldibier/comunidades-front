import { useQuery } from '@tanstack/react-query'
import { loadMinistries } from '../../api/records'
import { MinistryCard } from './MinistryCard'

export function MinistryListPage() {
  const query = useQuery({ queryKey: ['ministries'], queryFn: loadMinistries })
  return (
    <>
      <h1>Comunidades</h1>
      <p className="cf-lead">Las comunidades a las que perteneces.</p>
      {query.isLoading && <p className="cf-wait">Cargando comunidades…</p>}
      {query.isError && <p className="cf-error">No se pudieron cargar las comunidades.</p>}
      {query.isSuccess && query.data.length === 0 && (
        <p className="cf-empty">No perteneces a una comunidad todavía.</p>
      )}
      {query.data && query.data.length > 0 && (
        <div className="cf-ministries">
          {query.data.map((ministry) => (
            <MinistryCard key={ministry.id} ministry={ministry} />
          ))}
        </div>
      )}
    </>
  )
}
