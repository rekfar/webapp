import { Logo } from './brand/Logo'
import { MapView } from './map/MapView'

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <Logo as="h1" />
        <span className="app__divider" aria-hidden="true" />
        <p className="app__subtitle">Kartdata fra Kartverket</p>
      </header>
      <main className="app__main">
        <MapView />
      </main>
    </div>
  )
}
