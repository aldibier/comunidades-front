import { useEffect, useState } from 'react'

type InstallPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function installedNow() {
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

function isIos() {
  const nav = navigator as Navigator & { standalone?: boolean }
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && nav.standalone !== true)
}

export function InstallApp() {
  const [installed, setInstalled] = useState(installedNow)
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const sync = () => setInstalled(installedNow())
    sync()
    media.addEventListener('change', sync)
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as InstallPrompt)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      media.removeEventListener('change', sync)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  async function install() {
    if (!promptEvent) return
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    setPromptEvent(null)
    if (choice.outcome === 'accepted') setInstalled(true)
  }

  return (
    <section className="cf-section cf-install">
      <h2>En tu celular</h2>
      <p>Puedes dejar Efata en la pantalla de inicio y abrirla como una aplicación.</p>
      {promptEvent ? (
        <p className="cf-actions">
          <button type="button" onClick={() => { void install() }}>Instalar en el celular</button>
        </p>
      ) : isIos() ? (
        <p>En Safari, toca Compartir y luego Agregar a inicio.</p>
      ) : (
        <p>En el menú del navegador, elige Instalar aplicación o Agregar a inicio.</p>
      )}
    </section>
  )
}
