import { apiClient } from './client';
import type { ApiResponse, Category } from '../types/api.types';

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/category/all');
    return res.data.data || [];
  },
};
