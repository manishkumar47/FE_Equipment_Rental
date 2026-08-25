import { apiClient } from './client';
import type {
  ApiResponse,
  EquipmentItem,
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
} from '../types/api.types';

export const equipmentApi = {
  getAll: async (): Promise<EquipmentItem[]> => {
    const res = await apiClient.get<ApiResponse<EquipmentItem[]>>('/equipments');
    return res.data.data || [];
  },

  getById: async (id: number): Promise<EquipmentItem> => {
    const res = await apiClient.get<ApiResponse<EquipmentItem>>(`/equipments/${id}`);
    return res.data.data;
  },

  create: async (data: CreateEquipmentPayload): Promise<EquipmentItem> => {
    const res = await apiClient.post<ApiResponse<EquipmentItem>>('/equipments', data);
    return res.data.data;
  },

  update: async (id: number, data: UpdateEquipmentPayload): Promise<EquipmentItem> => {
    const res = await apiClient.put<ApiResponse<EquipmentItem>>(`/equipments/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<string> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/equipments/${id}`);
    return res.data.message;
  },
};
