import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { useSession } from '../auth/SessionProvider'
import { PATHS } from '../routes/paths'

/**
 * The account corner of the header: sign in, or your own profile.
 *
 * Renders nothing while the startup probe is in the air. Showing "Logg inn" for
 * that moment and then swapping it for a name is a flicker that tells a
 * returning user they were logged out when they were not.
 */
export function AccountNav() {
  const { t } = useTranslation()
  const { status, user } = useSession()

  if (status === 'loading') return null

  if (status === 'signedOut') {
    return (
      <Link className="app__account" to={PATHS.signIn}>
        {t('nav.signIn')}
      </Link>
    )
  }

  const name = user?.displayName?.trim()

  return (
    <Link
      className="app__account"
      to={PATHS.profile}
      aria-label={name ? t('nav.profileFor', { name }) : undefined}
    >
      {name || t('nav.profile')}
    </Link>
  )
}
