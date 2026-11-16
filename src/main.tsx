import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import './styles/global.css'
import { App } from './App.tsx'
import { QUESTIONS } from './data/questions.ts'
import { takeChallengeFromUrl } from './platform/share.ts'
import { UpdateNotice } from './components/UpdateNotice.tsx'
import { ProgressProvider } from './progress/ProgressProvider.tsx'

// Raz, przed renderowaniem: odczyt wyzwania z `#…` i wyczyszczenie adresu (to efekt uboczny, nie stan Reacta).
const initialLink = takeChallengeFromUrl(QUESTIONS.length)

const root = document.getElementById('root')
if (!root) throw new Error('Brak elementu #root')

createRoot(root).render(
  <StrictMode>
    <ProgressProvider>
      <App initialLink={initialLink} />
      <UpdateNotice />
    </ProgressProvider>
  </StrictMode>,
)
