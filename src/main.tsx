import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { purgeLegacyManualPaperDrafts } from './lib/manualPaperDraftStorage'
import './styles/index.css'

purgeLegacyManualPaperDrafts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
