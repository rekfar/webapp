import { useTranslation } from 'react-i18next'
import { Link, Route, Routes } from 'react-router'

import { Logo } from './brand/Logo'
import { RequireSession } from './auth/RequireSession'
import { MapPage } from './routes/MapPage'
import { NotFoundPage } from './routes/NotFoundPage'
import { ProfilePage } from './routes/ProfilePage'
import { SignInPage } from './routes/SignInPage'
import { PATHS } from './routes/paths'
import { AccountNav } from './ui/AccountNav'

/**
 * The app shell and its routes.
 *
 * Paths are the router's; the URL fragment stays the map's (`#zoom/lat/lon`,
 * see `src/map/HashSync.tsx`), which is why this is a `BrowserRouter` — hash
 * routing would fight the viewport for the same half of the URL.
 */
export default function App() {
  const { t } = useTranslation()

  return (
    <div className="app">
      <header className="app__header">
        <Link className="app__brand" to={PATHS.map}>
          <Logo />
        </Link>
        <span className="app__divider" aria-hidden="true" />
        <p className="app__subtitle">{t('app.subtitle')}</p>
        <AccountNav />
      </header>

      <main className="app__main">
        <Routes>
          <Route path={PATHS.map} element={<MapPage />} />
          <Route path={PATHS.signIn} element={<SignInPage />} />
          <Route
            path={PATHS.profile}
            element={
              <RequireSession>
                <ProfilePage />
              </RequireSession>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}
