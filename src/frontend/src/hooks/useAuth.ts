import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { tokenRequest } from '../config/authConfig';

/**
 * Custom hook for authentication operations
 *
 * Provides easy access to authentication state and token acquisition
 */
export const useAuth = () => {
  const { instance, accounts, inProgress } = useMsal();

  const isAuthenticated = accounts.length > 0;
  const isLoading = inProgress !== InteractionStatus.None;
  const account = accounts[0] || null;

  /**
   * Acquires an access token silently for the backend API
   * Falls back to interactive login if silent acquisition fails
   */
  const getAccessToken = async (): Promise<string | null> => {
    if (!account) {
      console.warn('No account available for token acquisition');
      return null;
    }

    try {
      // Try to acquire token silently
      const response = await instance.acquireTokenSilent({
        ...tokenRequest,
        account: account,
      });
      return response.accessToken;
    } catch (error) {
      console.warn('Silent token acquisition failed, trying popup', error);

      try {
        // Fall back to interactive redirect
        await instance.acquireTokenRedirect(tokenRequest);
        // After redirect, the token will be available via silent acquisition
        return null;
      } catch (redirectError) {
        console.error('Token acquisition failed:', redirectError);
        return null;
      }
    }
  };

  /**
   * Initiates the login flow using redirect (more reliable than popup)
   */
  const login = async () => {
    try {
      await instance.loginRedirect({
        scopes: ['User.Read'],
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  /**
   * Logs out the current user using redirect
   */
  const logout = async () => {
    try {
      await instance.logoutRedirect({
        account: account,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return {
    isAuthenticated,
    isLoading,
    account,
    login,
    logout,
    getAccessToken,
  };
};
