import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { allRegistriesPath, loadAuthors, loadPeople, loadSectors, loadTerms } from '../../api/records'
import { isLeader, useMe } from '../../app/session'
import { formatDate } from '../../ui/format'
import { PersonSearch } from './PersonSearch'

export function LeaderListPage() {
  const me = useMe()
  const leader = isLeader(me)
  const [q, setQ] = useState('')
  const [stage, setStage] = useState('')
  const [city, setCity] = useState('')
  const [sector, setSector] = useState('')
  const [author, setAuthor] = useState('')
  const stages = useQuery({ queryKey: ['terms', 'stage_life'], queryFn: () => loadTerms('stage_life') })
  const cities = useQuery({ queryKey: ['terms', 'ciudad'], queryFn: () => loadTerms('ciudad') })
  const sectors = useQuery({ queryKey: ['terms', 'sectores_manizales'], queryFn: loadSectors })
  const authors = useQuery({ queryKey: ['authors'], queryFn: loadAuthors, enabled: leader })
  const query = useInfiniteQuery({
    queryKey: ['registries', 'all', q, stage, city, sector, author, leader ? 'leader' : me.uuid],
    initialPageParam: leader
      ? allRegistriesPath({ stage, city, sector, author, q })
      : allRegistriesPath({ stage, city, sector, author: me.uuid, q }),
    queryFn: ({ pageParam }) => loadPeople(pageParam),
    getNextPageParam: (last) => last.next ?? undefined,
  })
  const people = query.data?.pages.flatMap((page) => page.people) ?? []

  return (
    <>
      <h1>Evangelizados</h1>
      {leader ? (
        <p className="cf-lead">Todas las fichas registradas.</p>
      ) : (
        <p className="cf-lead">Estas son solo las personas que registraste.</p>
      )}
      {leader && (
        <p className="cf-actions">
          <a href="/admin/evangelismo/export/full">Descargar CSV</a>
        </p>
      )}
      <PersonSearch onSearch={setQ} />
      <div className="cf-filters">
        <label className="cf-field">
          <span>Etapa de vida</span>
          <select value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="">Todas</option>
            {stages.data?.map((term) => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
        </label>
        <label className="cf-field">
          <span id="cf-filter-city">Ciudad</span>
          <select
            aria-labelledby="cf-filter-city"
            value={city}
            onChange={(event) => {
              setCity(event.target.value)
              setSector('')
            }}
          >
            <option value="">Todas</option>
            {cities.data?.map((term) => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
        </label>
        <label className="cf-field">
          <span id="cf-filter-sector">Sector</span>
          <select aria-labelledby="cf-filter-sector" value={sector} onChange={(event) => setSector(event.target.value)} disabled={!city}>
            <option value="">{city ? 'Todos' : 'Elige primero la ciudad'}</option>
            {sectors.data?.filter((term) => term.cityId === city).map((term) => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
        </label>
        {leader && (
          <label className="cf-field">
            <span>Quién registró</span>
            <select value={author} onChange={(event) => setAuthor(event.target.value)}>
              <option value="">Todas las personas</option>
              {authors.data?.map((term) => (
                <option key={term.id} value={term.id}>{term.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      {query.isLoading && <p className="cf-wait">Cargando fichas…</p>}
      {query.isError && <p className="cf-error">No se pudo cargar el listado.</p>}
      {query.isSuccess && people.length === 0 && (
        <p className="cf-empty">{q ? 'No hay personas con ese nombre.' : 'No hay fichas con ese filtro.'}</p>
      )}
      <div>
        {people.map((person) => (
          <Link className="cf-row" key={person.id} to={`/evangelismo/${person.id}`}>
            <strong>{person.name}</strong>
            <p className="cf-meta">
              {[person.author, person.stage, person.city, person.sector, person.event, person.phone, person.created ? formatDate(person.created) : ''].filter(Boolean).join(', ')}
            </p>
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
