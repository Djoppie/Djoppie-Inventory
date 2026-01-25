import { PublicClientApplication } from '@azure/msal-browser';
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
          console.warn('Failed to acquire token silently:', error);
          // Token acquisition failed - request will proceed without token
          // The backend should return 401, which will trigger user login
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};
