import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { LoginPage } from '../features/auth/LoginPage'
import { CommunityPage } from '../features/community/CommunityPage'
import { EventPage } from '../features/community/EventPage'
import { WritingPage } from '../features/community/WritingPage'
import { EventDetailPage } from '../features/evangelism/EventDetailPage'
import { EventFormPage } from '../features/evangelism/EventFormPage'
import { EventListPage } from '../features/evangelism/EventListPage'
import { LeaderListPage } from '../features/evangelism/LeaderListPage'
import { RegistryDetailPage } from '../features/evangelism/RegistryDetailPage'
import { RegistryFormPage } from '../features/evangelism/RegistryFormPage'
import { RegistryListPage } from '../features/evangelism/RegistryListPage'
import { HomePage } from '../features/home/HomePage'
import { MinistryDetailPage } from '../features/ministries/MinistryDetailPage'
import { MinistryListPage } from '../features/ministries/MinistryListPage'
import {
  MinistryEventsPage,
  MinistryEvangelismPage,
  MinistryMembersPage,
  MinistryPublicationPage,
  MinistryPublicationsPage,
} from '../features/ministries/MinistrySections'
import { ProfilePage } from '../features/profile/ProfilePage'
import { Shell } from './Shell'
import { useSession } from './session'

function Gate() {
  const session = useSession()
  const location = useLocation()
  if (session.status === 'loading') return <p className="cf-wait cf-main">Cargando…</p>
  if (session.status === 'error') return <p className="cf-error cf-main">{session.message}</p>
  if (session.status === 'anonymous') {
    return location.pathname === '/login' ? <Outlet /> : <Navigate to="/login" replace />
  }
  if (location.pathname === '/login') return <Navigate to="/" replace />
  return <Outlet />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Gate />}>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="evangelismo" element={<RegistryListPage />} />
          <Route path="evangelismo/nuevo" element={<RegistryFormPage />} />
          <Route path="evangelismo/todos" element={<LeaderListPage />} />
          <Route path="evangelismo/eventos" element={<EventListPage />} />
          <Route path="evangelismo/eventos/:uuid" element={<EventDetailPage />} />
          <Route path="evangelismo/:uuid" element={<RegistryDetailPage />} />
          <Route path="evangelismo/:uuid/editar" element={<RegistryFormPage />} />
          <Route path="comunidades" element={<MinistryListPage />} />
          <Route path="comunidades/:uuid/eventos/nuevo" element={<EventFormPage />} />
          <Route path="comunidades/:uuid/eventos" element={<MinistryEventsPage />} />
          <Route path="comunidades/:uuid/evangelismo" element={<MinistryEvangelismPage />} />
          <Route path="comunidades/:uuid/publicaciones/:pageId" element={<MinistryPublicationPage />} />
          <Route path="comunidades/:uuid/publicaciones" element={<MinistryPublicationsPage />} />
          <Route path="comunidades/:uuid/miembros" element={<MinistryMembersPage />} />
          <Route path="comunidades/:uuid" element={<MinistryDetailPage />} />
          <Route path="avisos" element={<CommunityPage />} />
          <Route path="avisos/eventos/:uuid" element={<EventPage />} />
          <Route path="avisos/paginas/:uuid" element={<WritingPage kind="page" />} />
          <Route path="avisos/articulos/:uuid" element={<WritingPage kind="article" />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
