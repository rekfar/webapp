import { useEffect } from 'react'

/**
 * Sets the document title for the route that is mounted.
 *
 * Client-side navigation leaves the title alone otherwise, so without this
 * every route would read "Rekfar — Kart". Each route sets its own and none
 * restores anything: unmount cleanups and mount effects of two different routes
 * interleave, so a restoring version can put the outgoing page's title back
 * over the incoming one's.
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title
  }, [title])
}
