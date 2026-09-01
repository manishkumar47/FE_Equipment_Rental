import { apiClient } from './client';
import type { ApiResponse, MyFineEntry, Fine } from '../types/api.types';

export const fineApi = {
  /**
   * Get the authenticated user's fines
   * GET /fines/my
   */
  getMyFines: async (): Promise<MyFineEntry[]> => {
    const res = await apiClient.get<ApiResponse<MyFineEntry[]>>('/fines/my');
    return res.data.data || [];
  },

  /**
   * Pay a fine (stub — no real payment gateway yet)
   * POST /fines/:id/pay
   */
  pay: async (fineId: number): Promise<Fine> => {
    const res = await apiClient.post<ApiResponse<Fine>>(`/fines/${fineId}/pay`);
    return res.data.data;
  },
};
