import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { addNote, deleteRegistry, loadNotes, loadPerson } from '../../api/records'
import { isLeader, useMe } from '../../app/session'
import { formatDate, formatDateTime, whatsappHref } from '../../ui/format'

export function RegistryDetailPage() {
  const { uuid = '' } = useParams()
  const me = useMe()
  const leader = isLeader(me)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const person = useQuery({ queryKey: ['registry', uuid], queryFn: () => loadPerson(uuid) })
  const notes = useQuery({ queryKey: ['notes', uuid], queryFn: () => loadNotes(uuid), enabled: person.isSuccess })
  const [body, setBody] = useState('')
  const [writing, setWriting] = useState(false)
  const note = useMutation({
    mutationFn: () => addNote(uuid, body),
    onSuccess: async () => {
      setBody('')
      setWriting(false)
      await queryClient.invalidateQueries({ queryKey: ['notes', uuid] })
    },
  })
  const remove = useMutation({
    mutationFn: () => deleteRegistry(uuid),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['registries'] })
      navigate('/evangelismo')
    },
  })

  if (person.isLoading) return <p className="cf-wait">Cargando la ficha…</p>
  if (person.isError) {
    const message = person.error instanceof ApiError ? person.error.message : 'No se pudo abrir esta ficha.'
    return <p className="cf-error">{message}</p>
  }
  if (!person.data) return null
  const current = person.data
  const canEdit = leader || current.authorId === me.uuid
  const phoneHref = whatsappHref(current.phone)
  const noteError = note.error instanceof ApiError ? note.error.message : note.isError ? 'No se pudo guardar la nota.' : ''

  return (
    <>
      <p><Link to="/evangelismo">Volver</Link></p>
      <h1>{current.name}</h1>
      {current.phone && <p>{current.phone}</p>}
      <p className="cf-meta">
        {[current.stage, current.city, current.sector || 'Sin sector'].filter(Boolean).join(', ')}
        {current.created ? `, ${formatDate(current.created)}` : ''}
      </p>
      {current.event && (
        <p className="cf-meta">
          Evento <Link to={`/evangelismo/eventos/${current.eventId}`}>{current.event}</Link>
        </p>
      )}
      {current.author && <p className="cf-meta">Registró {current.author}</p>}
      <p className="cf-actions">
        {phoneHref && <a className="cf-button" href={phoneHref}>Escribir por WhatsApp</a>}
        {canEdit && (
          <Link className={phoneHref ? undefined : 'cf-button'} to={`/evangelismo/${uuid}/editar`}>Corregir datos</Link>
        )}
        {leader && (
          <button
            className="cf-quiet"
            type="button"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm('¿Borrar esta ficha?')) remove.mutate()
            }}
          >
            Borrar esta ficha
          </button>
        )}
      </p>
      {remove.isError && <p className="cf-error">No se pudo borrar la ficha.</p>}
      {current.prayer && (
        <section className="cf-prayer">
          <h2>Petición de oración</h2>
          <p>{current.prayer}</p>
        </section>
      )}
      {current.notes && (
        <section className="cf-section">
          <h2>Observaciones</h2>
          <p>{current.notes}</p>
        </section>
      )}
      <section className="cf-section">
        <h2>Notas</h2>
        {notes.isLoading && <p className="cf-wait">Cargando notas…</p>}
        {notes.isSuccess && notes.data.length === 0 && !writing && <p className="cf-empty">Todavía no hay notas.</p>}
        {notes.data?.map((item) => (
          <article className="cf-note" key={item.id}>
            <p>{item.body}</p>
            <p className="cf-meta">
              {item.author}
              {item.created ? `, ${formatDateTime(item.created)}` : ''}
            </p>
          </article>
        ))}
        {writing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (body.trim()) note.mutate()
            }}
          >
            <label className="cf-field">
              <span>Nueva nota</span>
              <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} />
            </label>
            {noteError && <p className="cf-error">{noteError}</p>}
            <p className="cf-actions">
              <button type="submit" disabled={note.isPending || !body.trim()}>Guardar nota</button>
            </p>
          </form>
        ) : (
          <p className="cf-actions">
            <button type="button" onClick={() => setWriting(true)}>Agregar nota</button>
          </p>
        )}
      </section>
    </>
  )
}
