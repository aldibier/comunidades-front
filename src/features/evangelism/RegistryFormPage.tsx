import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { createRegistry, loadEvangelismEvents, loadPerson, loadSectors, loadTerms, updateRegistry, type EvangelismEvent, type RegistryInput, type Term } from '../../api/records'

const STAGE_ORDER = ['Adulto', 'Joven', 'Adolescente', 'Adulto Mayor']

function orderedStages(terms: Term[]) {
  return [...terms].sort((a, b) => {
    const left = STAGE_ORDER.indexOf(a.name)
    const right = STAGE_ORDER.indexOf(b.name)
    return (left === -1 ? STAGE_ORDER.length : left) - (right === -1 ? STAGE_ORDER.length : right)
  })
}

function eventChoices(events: EvangelismEvent[] | undefined, currentId: string, currentTitle: string): EvangelismEvent[] {
  const open = (events ?? []).filter((item) => item.open)
  if (!currentId || open.some((item) => item.id === currentId)) return open
  const current = events?.find((item) => item.id === currentId)
  if (current) return [...open, current]
  return [...open, {
    id: currentId,
    title: currentTitle || 'Evento',
    when: '',
    until: '',
    open: false,
    evangelism: true,
    ministry: null,
    mine: 0,
  }]
}

const EMPTY: RegistryInput = {
  name: '',
  phone: '',
  stageId: '',
  cityId: '',
  sectorId: '',
  eventId: '',
  prayer: '',
  notes: '',
}

export function RegistryFormPage() {
  const { uuid } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const editing = Boolean(uuid)
  const person = useQuery({
    queryKey: ['registry', uuid],
    queryFn: () => loadPerson(uuid ?? ''),
    enabled: editing,
  })
  const stages = useQuery({ queryKey: ['terms', 'stage_life'], queryFn: () => loadTerms('stage_life') })
  const cities = useQuery({ queryKey: ['terms', 'ciudad'], queryFn: () => loadTerms('ciudad') })
  const sectors = useQuery({ queryKey: ['terms', 'sectores_manizales'], queryFn: loadSectors })
  const events = useQuery({ queryKey: ['evangelism-events'], queryFn: loadEvangelismEvents })
  const form = useForm<RegistryInput>({ defaultValues: EMPTY })
  const cityId = form.watch('cityId')
  const cityField = form.register('cityId')
  const nameField = form.register('name', { required: 'Escribe el nombre.' })
  const nameRef = useRef<HTMLInputElement | null>(null)
  const eventPreset = useRef(false)
  const [saved, setSaved] = useState<{ id: string; name: string } | null>(null)
  const [more, setMore] = useState(editing)
  const save = useMutation({
    mutationFn: async ({ input, intent }: { input: RegistryInput; intent: 'stay' | 'open' }) => {
      if (uuid) {
        await updateRegistry(uuid, input)
        return { id: uuid, intent, input }
      }
      const id = await createRegistry(input)
      return { id, intent, input }
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['registries'] })
      await queryClient.invalidateQueries({ queryKey: ['evangelism-events'] })
      await queryClient.invalidateQueries({ queryKey: ['evangelism-event'] })
      if (uuid) {
        await queryClient.invalidateQueries({ queryKey: ['registry', uuid] })
        navigate(`/evangelismo/${uuid}`)
        return
      }
      if (result.intent === 'open') {
        navigate(`/evangelismo/${result.id}`)
        return
      }
      setSaved({ id: result.id, name: result.input.name })
      form.reset({
        ...result.input,
        name: '',
        phone: '',
        prayer: '',
        notes: '',
      })
      nameRef.current?.focus()
    },
  })

  const eventsReady = events.isSuccess || events.isError
  useEffect(() => {
    // A select drops a value whose option is not rendered yet, and that
    // change clears the field. Wait until the lists are in the DOM.
    if (!person.data || !stages.data || !cities.data || !sectors.data || !eventsReady) return
    form.reset({
      name: person.data.name,
      phone: person.data.phone,
      stageId: person.data.stageId,
      cityId: person.data.cityId,
      sectorId: person.data.sectorId,
      eventId: person.data.eventId,
      prayer: person.data.prayer,
      notes: person.data.notes,
    })
  }, [person.data, stages.data, cities.data, sectors.data, eventsReady, form])

  useEffect(() => {
    if (editing || eventPreset.current || !events.data) return
    const open = events.data.filter((item) => item.open)
    const requested = open.find((item) => item.id === params.get('evento'))
    if (requested) form.setValue('eventId', requested.id)
    else if (open.length === 1) form.setValue('eventId', open[0].id)
    eventPreset.current = true
  }, [editing, events.data, params, form])

  const failure = save.error instanceof ApiError ? save.error.message : save.isError ? 'No se pudo guardar la ficha.' : ''
  const choices = eventChoices(
    events.data,
    editing ? (person.data?.eventId ?? '') : '',
    editing ? (person.data?.event ?? '') : '',
  )

  return (
    <>
      <h1>{editing ? 'Corregir datos' : 'Registrar a alguien'}</h1>
      {saved && (
        <div role="status">
          <p className="cf-lead">Quedó el registro de {saved.name}.</p>
          <p className="cf-actions">
            <button type="button" onClick={() => nameRef.current?.focus()}>Registrar a otra persona</button>
            <Link to={`/evangelismo/${saved.id}`}>Ver la ficha</Link>
          </p>
        </div>
      )}
      {editing && person.isLoading && <p className="cf-wait">Cargando la ficha…</p>}
      {editing && person.isError && <p className="cf-error">No se pudo abrir esta ficha.</p>}
      <form
        onSubmit={form.handleSubmit((values) => {
          const sector = sectors.data?.find((term) => term.id === values.sectorId)
          const input = sector && sector.cityId !== values.cityId ? { ...values, sectorId: '' } : values
          save.mutate({ input, intent: editing ? 'open' : 'stay' })
        })}
        noValidate
      >
        <fieldset className="cf-choices">
          <legend>Etapa de vida</legend>
          <div className="cf-choice-grid">
            {orderedStages(stages.data ?? []).map((term) => (
              <label className="cf-chip" key={term.id}>
                <input type="radio" value={term.id} {...form.register('stageId', { required: 'Elige la etapa de vida.' })} />
                <span>{term.name}</span>
              </label>
            ))}
          </div>
          {form.formState.errors.stageId && <p className="cf-error">{form.formState.errors.stageId.message}</p>}
        </fieldset>
        <label className="cf-field">
          <span>Nombre completo</span>
          <input
            {...nameField}
            ref={(element) => {
              nameField.ref(element)
              nameRef.current = element
            }}
            autoComplete="off"
          />
          {form.formState.errors.name && <p className="cf-error">{form.formState.errors.name.message}</p>}
        </label>
        <label className="cf-field">
          <span>Celular</span>
          <input {...form.register('phone', { required: 'Escribe el celular.' })} inputMode="tel" autoComplete="off" />
          {form.formState.errors.phone && <p className="cf-error">{form.formState.errors.phone.message}</p>}
        </label>
        {choices.length > 0 ? (
          <label className="cf-field">
            <span id="cf-event">Evento</span>
            <select aria-labelledby="cf-event" {...form.register('eventId')}>
              <option value="">Sin evento</option>
              {choices.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>
        ) : (
          events.isSuccess && !editing && (
            <p className="cf-meta">No hay un evento abierto. La ficha queda sin evento.</p>
          )
        )}
        {!more && (
          <p className="cf-actions">
            <button type="button" onClick={() => setMore(true)}>Agregar más datos</button>
          </p>
        )}
        {more && (
          <>
        <label className="cf-field">
          <span id="cf-city">Ciudad</span>
          <select
            aria-labelledby="cf-city"
            {...cityField}
            onChange={(event) => {
              cityField.onChange(event)
              form.setValue('sectorId', '')
            }}
          >
            <option value="">Sin ciudad</option>
            {cities.data?.map((term) => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
        </label>
        <label className="cf-field">
          <span id="cf-sector">Sector donde vive</span>
          <select aria-labelledby="cf-sector" {...form.register('sectorId')} disabled={!cityId}>
            <option value="">{cityId ? 'Sin sector' : 'Elige primero la ciudad'}</option>
            {sectors.data?.filter((term) => term.cityId === cityId).map((term) => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
        </label>
        <label className="cf-field">
          <span>Petición de oración</span>
          <input {...form.register('prayer')} autoComplete="off" />
        </label>
        <label className="cf-field">
          <span>Observaciones</span>
          <input
            {...form.register('notes')}
            autoComplete="off"
            placeholder="Notas de lo que observaste al compartir el evangelio."
          />
        </label>
          </>
        )}
        {events.isError && <p className="cf-error">No se pudieron cargar los eventos. La ficha se puede guardar igual.</p>}
        {failure && <p className="cf-error">{failure}</p>}
        <p className="cf-actions">
          <button className="cf-button" type="submit" disabled={save.isPending}>
            {editing ? 'Guardar cambios' : 'Guardar'}
          </button>
          {uuid && <Link to={`/evangelismo/${uuid}`}>Volver</Link>}
        </p>
      </form>
    </>
  )
}
