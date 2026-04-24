import { logger } from '../utils/logger';
import { InteractionRequiredAuthError, PublicClientApplication } from '@azure/msal-browser';
import { tokenRequest } from '../config/authConfig';
import { apiClient } from './client';

/**
 * Configures Axios request interceptor to automatically add
 * authentication tokens to API requests
 *
 * @param msalInstance - The MSAL instance from the provider
 */
export const setupAuthInterceptor = (msalInstance: PublicClientApplication) => {
  // Request interceptor to add authentication token
  apiClient.interceptors.request.use(
    async (config) => {
      const accounts = msalInstance.getAllAccounts();

      if (accounts.length > 0) {
        try {
          // Try to acquire token silently
          const response = await msalInstance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
          });

          // Add the token to the Authorization header
          config.headers.Authorization = `Bearer ${response.accessToken}`;
        } catch (error) {
          logger.warn('Failed to acquire token silently:', error);
          // If the session truly requires re-authentication, trigger an interactive
          // redirect so the user is sent through Entra ID instead of cascading 401s.
          if (error instanceof InteractionRequiredAuthError) {
            await msalInstance.acquireTokenRedirect({
              ...tokenRequest,
              account: accounts[0],
            });
          }
          // Other errors (timeouts, network) — let the request proceed without a
          // token; the resulting 401 surfaces to the user without hijacking navigation.
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};
