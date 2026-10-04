export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

let csrfToken: string | null = null

async function readError(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const body = JSON.parse(text) as {
      message?: string
      errors?: { detail?: string; title?: string }[]
    }
    if (body.message) return body.message
    const detail = body.errors
      ?.map((error) => error.detail || error.title)
      .filter(Boolean)
      .join(' ')
    if (detail) return detail
  } catch {
    // The body was not JSON.
  }
  if (response.status === 403) return 'No tienes permiso para hacer esto.'
  if (response.status === 404) return 'No se encontró.'
  return 'No se pudo completar la acción.'
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { Accept: 'application/vnd.api+json' },
  })
  if (!response.ok) throw new ApiError(await readError(response), response.status)
  return response.json() as Promise<T>
}

async function csrf(): Promise<string> {
  if (csrfToken) return csrfToken
  const response = await fetch('/session/token', { credentials: 'include' })
  if (!response.ok) throw new ApiError('La sesión no está lista.', response.status)
  csrfToken = (await response.text()).trim()
  return csrfToken
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  jsonApi = true,
): Promise<T> {
  const send = async () => {
    const headers: Record<string, string> = {
      Accept: jsonApi ? 'application/vnd.api+json' : 'application/json',
      'X-CSRF-Token': await csrf(),
    }
    if (body !== undefined) {
      headers['Content-Type'] = jsonApi ? 'application/vnd.api+json' : 'application/json'
    }
    return fetch(path, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }

  let response = await send()
  if (response.status === 403) {
    csrfToken = null
    response = await send()
  }
  if (!response.ok) throw new ApiError(await readError(response), response.status)
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
