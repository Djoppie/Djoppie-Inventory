import { logger } from '../utils/logger';
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5052/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, config } = error.response;
      const url = config?.url || '';

      // Don't log 404s for expected cases where missing data is normal
      const isExpected404 =
        status === 404 && (
          url.includes('/leasecontracts/active/') || // No active lease contract
          url.includes('/intune/device/serial/') ||   // Device not in Intune
          url.includes('/graph/users/search')         // User search with no results
        );

      if (!isExpected404) {
        logger.error('API Error:', error.response.data);
      }
    }
    return Promise.reject(error);
  }
);
