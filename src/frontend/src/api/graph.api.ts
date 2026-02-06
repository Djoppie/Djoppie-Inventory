import { apiClient } from './client';
import { GraphUser } from '../types/graph.types';

/**
 * API service for Microsoft Graph operations
 * Provides functions to search and retrieve user information
 */

export const graphApi = {
  /**
   * Search for users in Azure AD
   * @param query - The search query (name or email)
   * @param top - Maximum number of results (default: 10)
   */
  searchUsers: async (query: string, top: number = 10): Promise<GraphUser[]> => {
    const response = await apiClient.get<GraphUser[]>('/graph/users/search', {
      params: { query, top }
    });
    return response.data;
  },

  /**
   * Get a specific user by Azure AD object ID
   * @param userId - The user's Azure AD object identifier
   */
  getUserById: async (userId: string): Promise<GraphUser> => {
    const response = await apiClient.get<GraphUser>(`/graph/users/${userId}`);
    return response.data;
  },

  /**
   * Get a specific user by User Principal Name (UPN/email)
   * @param upn - The user's UPN (email address)
   */
  getUserByUpn: async (upn: string): Promise<GraphUser> => {
    const response = await apiClient.get<GraphUser>(`/graph/users/upn/${upn}`);
    return response.data;
  },

  /**
   * Get the manager of a specific user
   * @param userId - The user's Azure AD object identifier
   */
  getUserManager: async (userId: string): Promise<GraphUser> => {
    const response = await apiClient.get<GraphUser>(`/graph/users/${userId}/manager`);
    return response.data;
  }
};
