import { apiClient } from './client';
import type { ApiResponse, Category } from '../types/api.types';

export const categoryApi = {
  getAll: async (signal?: AbortSignal): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/category/all', { signal });
    return res.data.data || [];
  },
};
