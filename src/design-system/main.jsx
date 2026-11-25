import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '../index.css'
import DesignSystem from './DesignSystem.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <DesignSystem />
    </HashRouter>
  </StrictMode>,
)
