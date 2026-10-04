import { NavLink, Outlet } from 'react-router-dom'
import { Mark } from '../ui/Mark'

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/avisos', label: 'Avisos', end: false },
  { to: '/perfil', label: 'Perfil', end: false },
]

export function Shell() {
  return (
    <div className="cf-sheet">
      <nav className="cf-nav" aria-label="Secciones">
        <p className="cf-brand">
          <Mark className="cf-mark cf-mark-brand" />
          <span className="cf-wordmark">EFATA</span>
          <span className="cf-slogan">Comunidades en Cristo</span>
        </p>
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <main className="cf-main">
        <Outlet />
      </main>
    </div>
  )
}
