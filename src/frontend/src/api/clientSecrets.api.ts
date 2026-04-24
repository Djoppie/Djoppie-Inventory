import { apiClient } from './client';
import type { AppCredential } from '../types/clientSecret.types';

export const getAppCredentials = async (): Promise<AppCredential[]> => {
  const response = await apiClient.get<AppCredential[]>('/clientsecrets');
  return response.data;
};
