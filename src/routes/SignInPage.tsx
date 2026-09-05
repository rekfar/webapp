import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router'

import { classifyCodeRejection, requestSignInCode, verifySignInCode } from '../api/auth'
import type { CodeRejection } from '../api/auth'
import { describeApiError, retryAfterSeconds } from '../api/errors'
import type { UserProfile } from '../api/me'
import { useSession } from '../auth/SessionProvider'
import { usePageTitle } from '../ui/usePageTitle'
import { PATHS } from './paths'

/**
 * Sign in, and register (FR-ACC-1, FR-ACC-2) — one screen, because they are one
 * flow: an unknown address gets an account when its code is verified
 * (ADR-0017). There is no password field, and nothing on this page reveals
 * whether the address was already known; the API answers identically either
 * way, and copy that said "welcome back" would give that away.
 */

/** How long the resend button stays disabled when the API sets no Retry-After. */
const RESEND_COOLDOWN_SECONDS = 60

/**
 * The two rejections that deserve their own wording rather than a generic
 * failure: a code that is gone, and one that has been guessed at too often.
 * Both mean "ask for a new one", which "noe gikk galt" would not tell anyone.
 */
const CODE_ERROR_KEYS: Record<Exclude<CodeRejection, 'unknown'>, string> = {
  invalid: 'signIn.errors.codeInvalid',
  expired: 'signIn.errors.codeExpired',
  tooManyAttempts: 'signIn.errors.tooManyAttempts',
}

/** Cheap sanity check; the address is confirmed by the code actually arriving. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Step = 'email' | 'code'

/** Where the navigation state says the visitor was heading, if anywhere. */
function intendedDestination(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null
  const from = (state as { from?: unknown }).from
  return typeof from === 'string' && from.startsWith('/') ? from : null
}

/**
 * Where a signed-in visitor belongs: the route the guard sent them away from,
 * or — for an account with no display name yet, which is what a registration
 * looks like from here — the profile, to finish setting it up (UC-1).
 */
function destinationFor(state: unknown, user: UserProfile | null): string {
  return intendedDestination(state) ?? (user?.displayName?.trim() ? PATHS.map : PATHS.profile)
}

export function SignInPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const { status, user, adopt, refresh } = useSession()

  usePageTitle(t('app.documentTitle.signIn'))

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  const emailFieldId = useId()
  const codeFieldId = useId()
  const codeField = useRef<HTMLInputElement>(null)

  // Tick the resend cooldown down. One interval for the whole countdown, torn
  // down as soon as it reaches zero rather than left running behind the page.
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (step === 'code') codeField.current?.focus()
  }, [step])

  // Nothing here to offer someone who is already signed in — which is also how
  // a verified code leaves this page: adopting the profile flips the status,
  // and this redirect is what moves them on. One route out, not two racing.
  if (status === 'signedIn') {
    return <Navigate to={destinationFor(location.state, user)} replace />
  }

  async function sendCode(resent: boolean) {
    const address = email.trim()

    if (!address) return setError(t('signIn.errors.emailRequired'))
    if (!EMAIL_PATTERN.test(address)) return setError(t('signIn.errors.emailInvalid'))

    setPending(true)
    setError(null)
    setNotice(null)

    try {
      await requestSignInCode(address)
      setStep('code')
      setCooldown(RESEND_COOLDOWN_SECONDS)
      if (resent) setNotice(t('signIn.resent'))
    } catch (cause) {
      // The request endpoint is rate-limited per address and per caller. When
      // it says how long to wait, the resend button waits exactly that long —
      // and a failure that says nothing leaves any cooldown already running
      // alone rather than freeing the button that just failed.
      const wait = retryAfterSeconds(cause)
      if (wait) setCooldown(wait)
      setError(describeApiError(cause, t))
    } finally {
      setPending(false)
    }
  }

  async function verify() {
    const entered = code.trim()
    if (!entered) return setError(t('signIn.errors.codeRequired'))

    setPending(true)
    setError(null)
    setNotice(null)

    try {
      const profile = await verifySignInCode(email.trim(), entered)

      // The session is a cookie now; there is no token to keep. Adopting the
      // profile the endpoint returned — or reading it back, which is the
      // authoritative answer either way — is what signs the app in, and the
      // redirect above does the rest.
      if (profile) adopt(profile)
      else await refresh()
    } catch (cause) {
      const rejection = classifyCodeRejection(cause)
      setError(
        rejection === 'unknown' ? describeApiError(cause, t) : t(CODE_ERROR_KEYS[rejection]),
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="page">
      <section className="card" aria-labelledby="sign-in-heading">
        {step === 'email' ? (
          <>
            <h1 className="card__title" id="sign-in-heading">
              {t('signIn.title')}
            </h1>
            <p className="card__lead">{t('signIn.intro')}</p>

            <form
              className="form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                void sendCode(false)
              }}
            >
              <div className="field">
                <label className="field__label" htmlFor={emailFieldId}>
                  {t('signIn.emailLabel')}
                </label>
                <input
                  className="field__input"
                  id={emailFieldId}
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  required
                  placeholder={t('signIn.emailPlaceholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <Feedback error={error} notice={notice} />

              <button className="button button--primary" type="submit" disabled={pending}>
                {pending ? t('signIn.sendingCode') : t('signIn.sendCode')}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="card__title" id="sign-in-heading">
              {t('signIn.checkEmailTitle')}
            </h1>
            <p className="card__lead">{t('signIn.checkEmailIntro', { email: email.trim() })}</p>

            <form
              className="form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                void verify()
              }}
            >
              <div className="field">
                <label className="field__label" htmlFor={codeFieldId}>
                  {t('signIn.codeLabel')}
                </label>
                <input
                  className="field__input field__input--code"
                  id={codeFieldId}
                  ref={codeField}
                  type="text"
                  name="one-time-code"
                  inputMode="numeric"
                  // Lets the browser and iOS offer the code straight from the
                  // message, which is the whole ergonomic argument for a code.
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </div>

              <Feedback error={error} notice={notice} />

              <button className="button button--primary" type="submit" disabled={pending}>
                {pending ? t('signIn.verifying') : t('signIn.verify')}
              </button>
            </form>

            <div className="card__actions">
              <button
                className="button button--ghost"
                type="button"
                disabled={pending || cooldown > 0}
                onClick={() => void sendCode(true)}
              >
                {cooldown > 0 ? t('signIn.resendIn', { seconds: cooldown }) : t('signIn.resend')}
              </button>

              {/* A mistyped address is the likeliest reason no code arrived. */}
              <button
                className="button button--link"
                type="button"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setError(null)
                  setNotice(null)
                }}
              >
                {t('signIn.changeEmail')}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function Feedback({ error, notice }: { error: string | null; notice: string | null }) {
  return (
    <div aria-live="polite">
      {error && (
        <p className="form-message form-message--error" role="alert">
          {error}
        </p>
      )}
      {!error && notice && <p className="form-message form-message--notice">{notice}</p>}
    </div>
  )
}
