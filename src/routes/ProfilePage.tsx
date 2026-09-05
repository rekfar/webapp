import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { updateProfile } from '../api/me'
import { describeApiError } from '../api/errors'
import { useSession } from '../auth/SessionProvider'
import { SUPPORTED_LOCALES } from '../i18n'
import { usePageTitle } from '../ui/usePageTitle'

/**
 * The profile (FR-ACC-3), and both ways out of a session (FR-ACC-2).
 *
 * "Logg ut på alle enheter" sits here rather than in a later settings screen on
 * purpose: with no password to change, rotating the session is the only control
 * a user has over a device they have lost, and there is no session list in
 * Phase 1 to offer anything more precise.
 */

type SaveState = 'idle' | 'saving' | 'saved'

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, adopt, signOut, signOutEverywhere } = useSession()

  usePageTitle(t('app.documentTitle.profile'))

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [locale, setLocale] = useState(user?.locale ?? SUPPORTED_LOCALES[0].code)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const displayNameId = useId()
  const localeId = useId()

  // The profile can arrive after this page mounts — a reload straight onto
  // /profil renders while `GET /me` is still in the air.
  useEffect(() => {
    if (!user) return
    setDisplayName(user.displayName ?? '')
    setLocale(user.locale)
  }, [user])

  if (!user) return null

  async function save() {
    setSaveState('saving')
    setError(null)

    try {
      const trimmed = displayName.trim()
      // An empty field means "no display name", which is a null on the wire,
      // not an empty string the API would have to interpret.
      const saved = await updateProfile({ displayName: trimmed === '' ? null : trimmed, locale })
      adopt(saved)
      setSaveState('saved')
    } catch (cause) {
      setSaveState('idle')
      setError(`${t('profile.saveFailed')} ${describeApiError(cause, t)}`)
    }
  }

  /*
    Neither sign-out navigates: dropping the session is what moves the user,
    because <RequireSession> around this page sends anyone without one to the
    sign-in screen. A page that also pushed a route of its own would be two
    redirects racing for the same navigation, and the loser is whichever React
    happens to flush second. A failure leaves the session — and this page —
    exactly where they were, with the reason on screen.
  */
  async function leave(everywhere: boolean) {
    setSigningOut(true)
    setError(null)

    try {
      await (everywhere ? signOutEverywhere() : signOut())
    } catch (cause) {
      setSigningOut(false)
      setError(`${t('profile.signOutFailed')} ${describeApiError(cause, t)}`)
    }
  }

  return (
    <div className="page">
      <section className="card" aria-labelledby="profile-heading">
        <h1 className="card__title" id="profile-heading">
          {t('profile.title')}
        </h1>

        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <div className="field">
            <span className="field__label">{t('profile.emailLabel')}</span>
            <p className="field__readonly">{user.email}</p>
            <p className="field__hint">{t('profile.emailHint')}</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={displayNameId}>
              {t('profile.displayNameLabel')}
            </label>
            <input
              className="field__input"
              id={displayNameId}
              type="text"
              autoComplete="nickname"
              maxLength={80}
              placeholder={t('profile.displayNamePlaceholder')}
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value)
                setSaveState('idle')
              }}
            />
            <p className="field__hint">{t('profile.displayNameHint')}</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={localeId}>
              {t('profile.localeLabel')}
            </label>
            {/* One option today. The list is data (src/i18n), so a second
                locale is a resource file and an entry — not a code change. */}
            <select
              className="field__input"
              id={localeId}
              value={locale}
              onChange={(event) => {
                setLocale(event.target.value)
                setSaveState('idle')
              }}
            >
              {SUPPORTED_LOCALES.map((supported) => (
                <option key={supported.code} value={supported.code}>
                  {t(supported.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div aria-live="polite">
            {error && (
              <p className="form-message form-message--error" role="alert">
                {error}
              </p>
            )}
            {!error && saveState === 'saved' && (
              <p className="form-message form-message--notice">{t('profile.saved')}</p>
            )}
          </div>

          <button className="button button--primary" type="submit" disabled={saveState === 'saving'}>
            {saveState === 'saving' ? t('profile.saving') : t('profile.save')}
          </button>
        </form>
      </section>

      <section className="card" aria-labelledby="session-heading">
        <h2 className="card__title" id="session-heading">
          {t('profile.sessionTitle')}
        </h2>

        <div className="card__row">
          <button
            className="button"
            type="button"
            disabled={signingOut}
            onClick={() => void leave(false)}
          >
            {signingOut ? t('profile.signingOut') : t('profile.signOut')}
          </button>
          <p className="card__hint">{t('profile.signOutHint')}</p>
        </div>

        <div className="card__row">
          <button
            className="button button--danger"
            type="button"
            disabled={signingOut}
            onClick={() => void leave(true)}
          >
            {signingOut ? t('profile.signingOut') : t('profile.signOutEverywhere')}
          </button>
          <p className="card__hint">{t('profile.signOutEverywhereHint')}</p>
        </div>
      </section>
    </div>
  )
}
