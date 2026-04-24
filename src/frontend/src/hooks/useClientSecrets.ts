import { useQuery } from '@tanstack/react-query';
import * as clientSecretsApi from '../api/clientSecrets.api';

export const useAppCredentials = () => {
  return useQuery({
    queryKey: ['clientSecrets'],
    queryFn: () => clientSecretsApi.getAppCredentials(),
    staleTime: 60_000,
  });
};
