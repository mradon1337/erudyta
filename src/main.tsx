import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import './styles/global.css'
import { App } from './App.tsx'
import { UpdateNotice } from './components/UpdateNotice.tsx'
import { ProgressProvider } from './progress/ProgressProvider.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('Brak elementu #root')

createRoot(root).render(
  <StrictMode>
    <ProgressProvider>
      <App />
      <UpdateNotice />
    </ProgressProvider>
  </StrictMode>,
)
