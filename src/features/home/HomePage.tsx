import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { loadMinistries, loadProfile } from '../../api/records'
import { useMe } from '../../app/session'
import { MinistryCard } from '../ministries/MinistryCard'

export function HomePage() {
  const me = useMe()
  const profile = useQuery({ queryKey: ['profile', me.uuid], queryFn: () => loadProfile(me.uuid) })
  const ministries = useQuery({ queryKey: ['ministries'], queryFn: loadMinistries })
  const givenName = profile.data?.nombres.trim() || me.name
  const missingProfile = profile.isSuccess && (!profile.data.nombres.trim() || !profile.data.cellphone.trim())

  return (
    <>
      <h1>{givenName}</h1>
      {missingProfile && (
        <p className="cf-error">
          Falta tu nombre o tu celular en el perfil. <Link to="/perfil">Completar perfil</Link>
        </p>
      )}
      <section className="cf-section">
        <h2>Comunidades</h2>
        {ministries.isLoading && <p className="cf-wait">Cargando comunidades…</p>}
        {ministries.isError && <p className="cf-error">No se pudieron cargar las comunidades.</p>}
        {ministries.isSuccess && ministries.data.length === 0 && (
          <p className="cf-empty">No perteneces a una comunidad todavía.</p>
        )}
        {ministries.data && ministries.data.length > 0 && (
          <div className="cf-ministries">
            {ministries.data.map((ministry) => (
              <MinistryCard key={ministry.id} ministry={ministry} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
