import { apiClient } from './client';
import type { ApiResponse, User, CreateUserPayload, Role } from '../types/api.types';

export const userApi = {
  getAll: async (signal?: AbortSignal): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<User[]>>('/users', { signal });
    return res.data.data || [];
  },

  getProfile: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/users/me');
    return res.data.data;
  },

  getById: async (id: number): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  create: async (data: CreateUserPayload): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data.data;
  },

  updateRole: async (id: number, role: Role): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
    return res.data.data;
  },

  delete: async (id: number): Promise<string> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
    return res.data.message;
  },
};
