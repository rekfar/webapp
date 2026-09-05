import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import 'leaflet/dist/leaflet.css'
import './styles.css'
// Initialises i18next before anything renders; useTranslation reads it.
import './i18n'
import App from './App'
import { SessionProvider } from './auth/SessionProvider'

const container = document.getElementById('root')
if (!container) throw new Error('Fant ikke #root i index.html')

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
