import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, type ReactNode } from 'react'
import { ApiError, apiGet } from '../api/client'

export type Me = {
  uid: number
  uuid: string
  name: string
  mail: string
  roles: string[]
}

type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'error'; message: string }
  | { status: 'ready'; me: Me }

const SessionContext = createContext<SessionState>({ status: 'loading' })

export function SessionProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ['me'],
    queryFn: () => apiGet<Me>('/api/me'),
    retry: false,
    staleTime: 60_000,
  })

  let value: SessionState = { status: 'loading' }
  if (query.isSuccess) value = { status: 'ready', me: query.data }
  else if (query.isError) {
    const denied = query.error instanceof ApiError && (query.error.status === 401 || query.error.status === 403)
    value = denied
      ? { status: 'anonymous' }
      : { status: 'error', message: query.error instanceof Error ? query.error.message : 'No se pudo abrir la sesión.' }
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}

export function useMe() {
  const session = useSession()
  if (session.status !== 'ready') {
    throw new Error('No hay sesión.')
  }
  return session.me
}

export function isLeader(me: Me) {
  return me.roles.includes('administrador_de_evangelismo') || me.roles.includes('administrator')
}
