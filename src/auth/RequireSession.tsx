import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'

import { PATHS } from '../routes/paths'
import { useSession } from './SessionProvider'

/**
 * Guards a route that has nothing to show an anonymous visitor.
 *
 * The startup probe is asynchronous, so "not signed in" and "not known yet" are
 * different answers: redirecting during `loading` would bounce a signed-in user
 * to sign-in on every reload. The route they wanted travels along in the
 * navigation state, so they land there rather than on the front page.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const location = useLocation()
  const { t } = useTranslation()

  if (status === 'loading') {
    return (
      <p className="page__status" role="status">
        {t('common.loading')}
      </p>
    )
  }

  if (status === 'signedOut') {
    return <Navigate to={PATHS.signIn} state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
