import { apiClient } from './client';
import type {
  ApiResponse,
  EquipmentUnit,
  CreateEquipmentUnitPayload,
  BulkCreateEquipmentUnitPayload,
  UpdateEquipmentUnitPayload,
} from '../types/api.types';

export const equipmentUnitApi = {
  getAll: async (equipmentId: number): Promise<EquipmentUnit[]> => {
    const res = await apiClient.get<ApiResponse<EquipmentUnit[]>>(
      `/equipments/${equipmentId}/items`
    );
    return res.data.data || [];
  },

  create: async (
    equipmentId: number,
    data: CreateEquipmentUnitPayload
  ): Promise<EquipmentUnit> => {
    const res = await apiClient.post<ApiResponse<EquipmentUnit>>(
      `/equipments/${equipmentId}/items`,
      data
    );
    return res.data.data;
  },

  bulkCreate: async (
    equipmentId: number,
    payload: BulkCreateEquipmentUnitPayload
  ): Promise<EquipmentUnit[]> => {
    const res = await apiClient.post<ApiResponse<EquipmentUnit[]>>(
      `/equipments/${equipmentId}/items/bulk`,
      payload
    );
    return res.data.data || [];
  },

  update: async (
    equipmentId: number,
    itemId: number,
    data: UpdateEquipmentUnitPayload
  ): Promise<EquipmentUnit> => {
    const res = await apiClient.patch<ApiResponse<EquipmentUnit>>(
      `/equipments/${equipmentId}/items/${itemId}`,
      data
    );
    return res.data.data;
  },

  delete: async (equipmentId: number, itemId: number): Promise<string> => {
    const res = await apiClient.delete<ApiResponse<null>>(
      `/equipments/${equipmentId}/items/${itemId}`
    );
    return res.data.message;
  },
};
