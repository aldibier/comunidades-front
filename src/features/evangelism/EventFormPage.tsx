import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { createMinistryEvent, loadMembers, loadMinistries } from '../../api/records'
import { useMe } from '../../app/session'
import { addHoursLocal, bogotaIso, minutesBetween } from '../../ui/format'

type EventDraft = { title: string; start: string; end: string; evangelism: boolean }

export function EventFormPage() {
  const { uuid = '' } = useParams()
  const me = useMe()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ministries = useQuery({ queryKey: ['ministries'], queryFn: loadMinistries })
  const members = useQuery({
    queryKey: ['members', uuid],
    queryFn: () => loadMembers(uuid),
    enabled: Boolean(uuid),
  })
  const ministry = ministries.data?.find((item) => item.id === uuid)
  const manages = me.roles.includes('administrator')
    || (members.data?.some((member) => member.admin && member.userId === me.uuid) ?? false)
  const form = useForm<EventDraft>({ defaultValues: { title: '', start: '', end: '', evangelism: false } })
  const activity = Boolean(ministry?.evangelism) && form.watch('evangelism')
  const save = useMutation({
    mutationFn: (draft: EventDraft) => {
      const endLocal = draft.end || addHoursLocal(draft.start, 2)
      const when = bogotaIso(draft.start)
      const until = bogotaIso(endLocal)
      return createMinistryEvent(uuid, {
        title: draft.title.trim(),
        when,
        until,
        duration: minutesBetween(when, until),
        evangelism: Boolean(ministry?.evangelism) && draft.evangelism,
      })
    },
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ['evangelism-events'] })
      await queryClient.invalidateQueries({ queryKey: ['ministry-events', uuid] })
      navigate(`/evangelismo/eventos/${id}`)
    },
  })

  if (ministries.isLoading || members.isLoading) return <p className="cf-wait">Cargando…</p>
  if (members.isError) return <p className="cf-error">No se pudieron cargar los miembros.</p>
  if (!ministry) return <p className="cf-empty">No se encontró esta comunidad, o no perteneces a ella.</p>
  if (!manages) {
    return (
      <>
        <h1>Registrar evento</h1>
        <p>Solo quien administra la comunidad puede registrar un evento.</p>
      </>
    )
  }

  const failure = save.error instanceof ApiError ? save.error.message : save.isError ? 'No se pudo registrar el evento.' : ''

  return (
    <>
      <h1>Registrar evento</h1>
      <p className="cf-lead">
        {ministry.evangelism
          ? 'Si es una actividad de evangelismo, al registrarlo se abren las fichas de ese día.'
          : 'Esta comunidad publica eventos informativos. El evangelismo está inactivo.'}
      </p>
      <form
        onSubmit={form.handleSubmit((draft) => {
          const endLocal = draft.end || addHoursLocal(draft.start, 2)
          if (new Date(bogotaIso(endLocal)).getTime() <= new Date(bogotaIso(draft.start)).getTime()) {
            form.setError('end', { message: 'La hora de cierre es anterior al inicio.' })
            return
          }
          save.mutate(draft)
        })}
        noValidate
      >
        <label className="cf-field">
          <span>Título</span>
          <input {...form.register('title', { required: 'Escribe el título.' })} autoComplete="off" />
          {form.formState.errors.title && <p className="cf-error">{form.formState.errors.title.message}</p>}
        </label>
        <label className="cf-field">
          <span>Cuándo</span>
          <input type="datetime-local" {...form.register('start', { required: 'Elige cuándo empieza.' })} />
          {form.formState.errors.start && <p className="cf-error">{form.formState.errors.start.message}</p>}
        </label>
        <label className="cf-field">
          <span>Hasta</span>
          <input type="datetime-local" {...form.register('end')} />
          {form.formState.errors.end && <p className="cf-error">{form.formState.errors.end.message}</p>}
        </label>
        {ministry.evangelism && (
          <div className="cf-field">
            <label className="cf-chip">
              <input type="checkbox" {...form.register('evangelism')} />
              Actividad de evangelismo
            </label>
          </div>
        )}
        {failure && <p className="cf-error">{failure}</p>}
        <p className="cf-actions">
          <button className="cf-button" type="submit" disabled={save.isPending}>
            {activity ? 'Abrir registros' : 'Publicar'}
          </button>
        </p>
      </form>
    </>
  )
}
