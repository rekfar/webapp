/**
 * Norwegian bokmål — the only locale that ships (ADR-0003, FR-I18N-1).
 *
 * Every user-visible string in the app lives here rather than in a component,
 * so adding `en` is a second file and a second entry in `SUPPORTED_LOCALES`
 * rather than a sweep through the components (FR-I18N-2).
 *
 * Keys are grouped by where they are shown. `{{name}}` placeholders are
 * i18next interpolation.
 */
export const nbNO = {
  app: {
    subtitle: 'Kartdata fra Kartverket',
    documentTitle: {
      map: 'Rekfar — Kart',
      signIn: 'Rekfar — Logg inn',
      profile: 'Rekfar — Profil',
      notFound: 'Rekfar — Fant ikke siden',
    },
  },

  nav: {
    map: 'Kart',
    signIn: 'Logg inn',
    profile: 'Profil',
    /** Screen-reader name for the account link when a display name is set. */
    profileFor: 'Profil for {{name}}',
  },

  common: {
    retry: 'Prøv igjen',
    cancel: 'Avbryt',
    toMap: 'Til kartet',
    loading: 'Laster …',
  },

  /* ---------- Sign-in (FR-ACC-1, FR-ACC-2) ---------- */

  signIn: {
    title: 'Logg inn',
    /*
      Registration and login are the same flow (ADR-0017), so the copy has to
      cover both without asking the visitor which one they are doing.
    */
    intro:
      'Skriv inn e-postadressen din, så sender vi deg en engangskode. Har du ikke konto fra før, blir den opprettet når du bekrefter koden. Rekfar bruker ikke passord.',
    emailLabel: 'E-postadresse',
    emailPlaceholder: 'navn@eksempel.no',
    sendCode: 'Send kode',
    sendingCode: 'Sender kode …',

    checkEmailTitle: 'Sjekk e-posten din',
    /*
      Says a code was sent, never whether the address was known — the API
      answers identically either way, and the UI must not undo that.
    */
    checkEmailIntro:
      'Vi har sendt en engangskode til {{email}}. Koden er gyldig i ti minutter, og kan bare brukes én gang.',
    codeLabel: 'Engangskode',
    verify: 'Logg inn',
    verifying: 'Logger inn …',
    changeEmail: 'Feil adresse? Endre e-postadresse',
    resend: 'Send koden på nytt',
    resendIn: 'Send koden på nytt (om {{seconds}} s)',
    resent: 'Vi har sendt en ny kode.',

    errors: {
      emailRequired: 'Skriv inn e-postadressen din.',
      emailInvalid: 'Skriv inn en gyldig e-postadresse.',
      codeRequired: 'Skriv inn koden fra e-posten.',
      /** Wrong code, but the code itself is still alive. */
      codeInvalid: 'Koden stemmer ikke. Sjekk at du har skrevet den riktig.',
      /** Expired or already used — a new code is the only way forward. */
      codeExpired: 'Koden er utløpt eller allerede brukt. Be om en ny kode.',
      /** The attempt cap was hit, so the code was thrown away. */
      tooManyAttempts:
        'For mange forsøk på denne koden. Vi har sperret den — be om en ny kode og prøv igjen.',
    },
  },

  /* ---------- Profile (FR-ACC-3) ---------- */

  profile: {
    title: 'Profil',
    emailLabel: 'E-postadresse',
    emailHint: 'E-postadressen er innloggingen din, og kan ikke endres her.',
    displayNameLabel: 'Visningsnavn',
    displayNamePlaceholder: 'Navnet andre ser',
    displayNameHint: 'Kan stå tomt.',
    localeLabel: 'Språk',
    save: 'Lagre',
    saving: 'Lagrer …',
    saved: 'Endringene er lagret.',
    saveFailed: 'Kunne ikke lagre endringene.',

    sessionTitle: 'Innlogging',
    signOut: 'Logg ut',
    signOutHint: 'Logger deg ut på denne enheten.',
    signOutEverywhere: 'Logg ut på alle enheter',
    /*
      With no password to change, rotating the session is the only control a
      user has over a lost device — so the button says what it is for.
    */
    signOutEverywhereHint:
      'Avslutter alle økter, også på enheter du ikke har i hånden. Bruk dette hvis du har mistet en enhet eller tror noen andre er logget inn.',
    signingOut: 'Logger ut …',
    signOutFailed: 'Kunne ikke logge ut.',
  },

  notFound: {
    title: 'Fant ikke siden',
    body: 'Adressen finnes ikke i Rekfar.',
  },

  /* ---------- Locales offered on the profile page ---------- */

  locales: {
    'nb-NO': 'Norsk (bokmål)',
  },

  /* ---------- Shared API failure copy ---------- */

  errors: {
    /** fetch() rejects with a TypeError when the request never got an answer. */
    network: 'Fikk ikke kontakt med API-et.',
    rateLimited: 'For mange forespørsler. Vent litt og prøv igjen.',
    rateLimitedIn: 'For mange forespørsler. Prøv igjen om {{seconds}} sekunder.',
    /*
      The likeliest 5xx is not a bug but a cold start: the API scales to zero
      and its database auto-pauses, so the first request after an idle period
      can outlast the proxy in front of it.
    */
    server: 'API-et svarte ikke. Det starter kanskje opp igjen — prøv om litt.',
    unexpected: 'Noe gikk galt. Prøv igjen.',
  },

  /* ---------- The map ---------- */

  map: {
    basemapLegend: 'Kartlag',
    basemaps: {
      topo: {
        label: 'Topografisk',
        description: 'Standard topografisk norgeskart',
      },
      toporaster: {
        label: 'Turkart',
        description: 'Rasterkart i tradisjonell papirkartstil',
      },
    },

    locate: {
      idle: 'Vis min posisjon',
      locating: 'Finner posisjon…',
      error: 'Fant ikke posisjon — prøv igjen',
    },
    youAreHere: 'Din posisjon',

    status: {
      pointer: 'Peker',
      center: 'Senter',
      coordinatesTitle: 'Breddegrad, lengdegrad (WGS 84)',
      zoom: 'Zoom',
    },

    peaks: {
      loading: 'Laster topper …',
      empty: 'Ingen topper i dette området',
      truncated: 'Viser de {{limit}} høyeste toppene — zoom inn for å se alle',
      failed: 'Kunne ikke hente topper. {{reason}}',
      elevation: 'Høyde',
      elevationValue: '{{meters}} moh.',
      elevationUnknown: 'Ukjent',
      prominence: 'Primærfaktor',
      prominenceValue: '{{meters}} m',
      utnoLink: 'Les mer på ut.no',
    },
  },
} as const
