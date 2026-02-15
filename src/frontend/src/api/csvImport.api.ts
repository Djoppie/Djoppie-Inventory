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

  downloadTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/csvimport/template', {
      responseType: 'blob',
    });
    return response.data;
  },
};
