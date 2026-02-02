import { Configuration, RedirectRequest } from '@azure/msal-browser';

/**
 * MSAL Configuration for Microsoft Entra ID Authentication
 *
 * This configuration sets up the authentication flow for Djoppie Inventory
 * using Microsoft Entra ID (formerly Azure AD) for single sign-on.
 */

// MSAL Configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID || '',
    authority: import.meta.env.VITE_ENTRA_AUTHORITY || '',
    redirectUri: import.meta.env.VITE_ENTRA_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_ENTRA_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage', // Use sessionStorage for better security
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // Error
            console.error(message);
            break;
          case 1: // Warning
            console.warn(message);
            break;
          case 2: // Info
            console.info(message);
            break;
          case 3: // Verbose
            console.debug(message);
            break;
        }
      },
    },
  },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints
export const loginRequest: RedirectRequest = {
  scopes: [
    'User.Read', // Microsoft Graph scope to read user profile
    import.meta.env.VITE_ENTRA_API_SCOPE || '', // Backend API scope
  ].filter(Boolean), // Remove empty strings
};

// Add the backend API scope for accessing protected API endpoints
export const tokenRequest = {
  scopes: [import.meta.env.VITE_ENTRA_API_SCOPE || ''].filter(Boolean),
};

// Scopes for Microsoft Graph API (optional - for user profile info)
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};
