import { MapView } from './map/MapView'

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Rekfar</h1>
        <p className="app__subtitle">Kartdata fra Kartverket</p>
      </header>
      <main className="app__main">
        <MapView />
      </main>
    </div>
  )
}
