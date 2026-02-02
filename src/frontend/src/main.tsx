import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './config/authConfig'
import { setupAuthInterceptor } from './api/authInterceptor'
import './index.css'
import './i18n/config'
import App from './App.tsx'

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig)

// Set up event callbacks for MSAL
msalInstance.addEventCallback((event: EventMessage) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const payload = event.payload as AuthenticationResult
    const account = payload.account
    msalInstance.setActiveAccount(account)
  }
})

// Initialize MSAL
await msalInstance.initialize()

// Set up authentication interceptor for API calls
setupAuthInterceptor(msalInstance)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </StrictMode>,
)
