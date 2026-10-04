import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { ApiError } from '../../api/client'
import { loadProfile, saveProfile, type Profile } from '../../api/records'
import { useMe } from '../../app/session'
import { InstallApp } from './InstallApp'

const EMPTY: Profile = { nombres: '', apellidos: '', cellphone: '', birthdate: '' }

export function ProfilePage() {
  const me = useMe()
  const queryClient = useQueryClient()
  const profile = useQuery({ queryKey: ['profile', me.uuid], queryFn: () => loadProfile(me.uuid) })
  const form = useForm<Profile>({ defaultValues: EMPTY })
  const save = useMutation({
    mutationFn: (values: Profile) => saveProfile(me.uuid, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', me.uuid] })
    },
  })

  useEffect(() => {
    if (profile.data) form.reset(profile.data)
  }, [profile.data, form])

  const incomplete = profile.isSuccess && (!profile.data.nombres.trim() || !profile.data.cellphone.trim())
  const failure = save.error instanceof ApiError ? save.error.message : save.isError ? 'No se pudo guardar el perfil.' : ''

  return (
    <>
      <h1>Perfil</h1>
      <p className="cf-lead">{me.mail}</p>
      {incomplete && <p className="cf-error">Falta tu nombre o tu celular.</p>}
      {profile.isLoading && <p className="cf-wait">Cargando el perfil…</p>}
      <form onSubmit={form.handleSubmit((values) => save.mutate(values))}>
        <label className="cf-field">
          <span>Nombres</span>
          <input {...form.register('nombres', { required: 'Escribe tus nombres.' })} />
          {form.formState.errors.nombres && <p className="cf-error">{form.formState.errors.nombres.message}</p>}
        </label>
        <label className="cf-field">
          <span>Apellidos</span>
          <input {...form.register('apellidos')} />
        </label>
        <label className="cf-field">
          <span>Celular</span>
          <input {...form.register('cellphone', { required: 'Escribe tu celular.' })} inputMode="tel" />
          {form.formState.errors.cellphone && <p className="cf-error">{form.formState.errors.cellphone.message}</p>}
        </label>
        <label className="cf-field">
          <span>Fecha de nacimiento</span>
          <input type="date" {...form.register('birthdate')} />
        </label>
        {failure && <p className="cf-error">{failure}</p>}
        {save.isSuccess && <p>Perfil guardado.</p>}
        <p className="cf-actions">
          <button className="cf-button" type="submit" disabled={save.isPending}>Guardar perfil</button>
        </p>
      </form>
      <InstallApp />
      <p><a href="/user/logout">Salir</a></p>
    </>
  )
}
