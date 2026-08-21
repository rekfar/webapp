import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

import { usePeaksInView } from './usePeaksInView'
import type { PeaksInView } from './usePeaksInView'

/**
 * Holds the peaks for the current extent so the marker layer and the status
 * chip read one fetch loop rather than each running their own. Must be rendered
 * inside <MapContainer> — the extent comes from Leaflet's map instance.
 */
const PeaksContext = createContext<PeaksInView | null>(null)

export function PeaksProvider({ children }: { children: ReactNode }) {
  const peaks = usePeaksInView()

  return <PeaksContext value={peaks}>{children}</PeaksContext>
}

export function usePeaks(): PeaksInView {
  const value = useContext(PeaksContext)
  if (!value) throw new Error('usePeaks må brukes innenfor <PeaksProvider>')
  return value
}
