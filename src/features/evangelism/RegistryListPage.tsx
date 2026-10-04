import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loadPeople, ownRegistriesPath } from '../../api/records'
import { isLeader, useMe } from '../../app/session'
import { PersonSearch } from './PersonSearch'

export function RegistryListPage() {
  const me = useMe()
  const leader = isLeader(me)
  const [q, setQ] = useState('')
  const query = useInfiniteQuery({
    queryKey: ['registries', 'own', me.uuid, q],
    initialPageParam: ownRegistriesPath(me.uuid, q),
    queryFn: ({ pageParam }) => loadPeople(pageParam),
    getNextPageParam: (last) => last.next ?? undefined,
  })
  const people = query.data?.pages.flatMap((page) => page.people) ?? []

  return (
    <>
      <h1>Mis evangelizados</h1>
      <p className="cf-lead">Las personas que has registrado.</p>
      <p className="cf-actions">
        <Link className="cf-button" to="/evangelismo/nuevo">
          Registrar a alguien
        </Link>
        <Link to="/evangelismo/eventos">Eventos</Link>
        {leader && <Link to="/evangelismo/todos">Ver todos</Link>}
      </p>
      <PersonSearch onSearch={setQ} />
      {query.isLoading && <p className="cf-wait">Cargando el registro…</p>}
      {query.isError && <p className="cf-error">No se pudo cargar el registro.</p>}
      {query.isSuccess && people.length === 0 && (
        <p className="cf-empty">
          {q ? 'No hay personas con ese nombre.' : 'Todavía no hay personas en tu registro.'}
        </p>
      )}
      <div>
        {people.map((person) => (
          <Link className="cf-row" key={person.id} to={`/evangelismo/${person.id}`}>
            <strong>{person.name}</strong>
            {person.phone && <p className="cf-meta">{person.phone}</p>}
          </Link>
        ))}
      </div>
      {query.hasNextPage && (
        <p className="cf-actions">
          <button className="cf-button" type="button" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
            Cargar más
          </button>
        </p>
      )}
    </>
  )
}
