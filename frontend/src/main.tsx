import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Boutique } from './Boutique'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boutique />
  </StrictMode>,
)
