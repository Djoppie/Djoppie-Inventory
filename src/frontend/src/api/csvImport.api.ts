import { apiClient } from './client';

export interface CsvRowResult {
  rowNumber: number;
  success: boolean;
  assetCode?: string;
  serialNumber?: string;
  errors: string[];
}

export interface CsvImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  results: CsvRowResult[];
}

export const csvImportApi = {
  importCsv: async (file: File): Promise<CsvImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<CsvImportResult>('/csvimport/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  validateCsv: async (file: File): Promise<CsvImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<CsvImportResult>('/csvimport/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/csvimport/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  exportAssets: async (status?: string): Promise<Blob> => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/csvimport/export', {
      responseType: 'blob',
      params,
    });
    return response.data;
  },
};
