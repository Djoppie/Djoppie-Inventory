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

// When MSAL performs silent token refresh it loads this SPA in a hidden iframe
// at the configured redirectUri. Rendering the full app (React Router, MsalProvider,
// query setup) inside that iframe races with MSAL's hash processing and triggers
// `block_iframe_reload` → `timed_out` → 401 cascades. Detect the iframe-with-auth-hash
// case and skip the render; MSAL's initialize() above handles the token hand-off
// back to the parent window via the BroadcastChannel.
const isInMsalAuthIframe =
  window.self !== window.top &&
  (window.location.hash.includes('code=') || window.location.hash.includes('error='))

if (!isInMsalAuthIframe) {
  // Set up authentication interceptor for API calls
  setupAuthInterceptor(msalInstance)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  )
}
