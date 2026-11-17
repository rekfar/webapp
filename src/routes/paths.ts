/**
 * The routes this app has. Norwegian paths, like the rest of the UI (P5).
 *
 * Kept in one module so a link never spells a path out by hand, and so the
 * viewport fragment (`#zoom/lat/lon`) stays the map's alone — the router owns
 * the path, `HashSync` owns the hash, and neither writes the other's half.
 */
export const PATHS = {
  map: '/',
  signIn: '/logg-inn',
  profile: '/profil',
} as const
