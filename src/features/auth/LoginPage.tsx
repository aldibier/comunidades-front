import { Mark } from '../../ui/Mark'

export function LoginPage() {
  return (
    <main className="cf-main cf-login">
      <Mark />
      <h1 className="cf-wordmark">EFATA</h1>
      <p className="cf-slogan">Comunidades en Cristo</p>
      <p className="cf-actions">
        <a className="cf-button" href="/user/login/google">
          Continuar con Google
        </a>
      </p>
      <p className="cf-meta">
        Quien administra el sitio entra con <a href="/user/login">usuario y contraseña</a>.
      </p>
    </main>
  )
}
