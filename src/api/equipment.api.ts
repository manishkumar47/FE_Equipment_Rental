import { apiClient } from './client';
import type {
  ApiResponse,
  EquipmentItem,
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
  BulkCreateEquipmentItem,
  PaginatedResponse,
  EquipmentSortBy,
} from '../types/api.types';

export const equipmentApi = {
  getAll: async (): Promise<EquipmentItem[]> => {
    const res = await apiClient.get<ApiResponse<EquipmentItem[]>>('/equipments');
    return res.data.data || [];
  },

  /**
   * Paginated/filtered catalog listing.
   * GET /equipments?page=1&limit=24&search=&categoryId=&inStockOnly=&sortBy=
   */
  getPaginated: async (
    options: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: number;
      inStockOnly?: boolean;
      sortBy?: EquipmentSortBy;
    },
    signal?: AbortSignal
  ): Promise<PaginatedResponse<EquipmentItem>> => {
    const { page = 1, limit = 24, search, categoryId, inStockOnly, sortBy } = options;
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search && search.trim()) params.set('search', search.trim());
    if (categoryId) params.set('categoryId', categoryId.toString());
    if (inStockOnly) params.set('inStockOnly', 'true');
    if (sortBy) params.set('sortBy', sortBy);

    const res = await apiClient.get<ApiResponse<PaginatedResponse<EquipmentItem>>>(
      `/equipments?${params.toString()}`,
      { signal }
    );
    return res.data.data;
  },

  getById: async (id: number): Promise<EquipmentItem> => {
    const res = await apiClient.get<ApiResponse<EquipmentItem>>(`/equipments/${id}`);
    return res.data.data;
  },

  create: async (data: CreateEquipmentPayload): Promise<EquipmentItem> => {
    const res = await apiClient.post<ApiResponse<EquipmentItem>>('/equipments', data);
    return res.data.data;
  },

  bulkCreate: async (items: BulkCreateEquipmentItem[]): Promise<EquipmentItem[]> => {
    const res = await apiClient.post<ApiResponse<EquipmentItem[]>>('/equipments/bulk', { items });
    return res.data.data || [];
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

