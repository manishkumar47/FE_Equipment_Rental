import { apiClient } from './client';
import type {
  ApiResponse,
  RentalBookingItem,
  PaginatedResponse,
  ConfirmReturnPayload,
  ConfirmReturnResponse,
  RejectReturnPayload,
} from '../types/api.types';

export const returnApi = {
  /**
   * User requests equipment return
   * POST /rentals/:bookingId/return-request
   */
  requestReturn: async (bookingId: number): Promise<RentalBookingItem> => {
    const res = await apiClient.post<ApiResponse<RentalBookingItem>>(
      `/rentals/${bookingId}/return-request`
    );
    return res.data.data;
  },

  /**
   * Admin views pending return requests (paginated, with search)
   * GET /admin/rentals/return-requests?page=1&limit=20&search=
   */
  getPendingReturnRequests: async (
    page = 1,
    limit = 20,
    search?: string
  ): Promise<PaginatedResponse<RentalBookingItem>> => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search && search.trim()) {
      params.set('search', search.trim());
    }

    const res = await apiClient.get<ApiResponse<PaginatedResponse<RentalBookingItem>>>(
      `/admin/rentals/return-requests?${params.toString()}`
    );
    return res.data.data;
  },

  /**
   * Admin confirms equipment return with condition assessment
   * POST /admin/rentals/:bookingId/confirm-return
   */
  confirmReturn: async (
    bookingId: number,
    data: ConfirmReturnPayload
  ): Promise<ConfirmReturnResponse> => {
    const res = await apiClient.post<ApiResponse<ConfirmReturnResponse>>(
      `/admin/rentals/${bookingId}/confirm-return`,
      data
    );
    return res.data.data;
  },

  /**
   * Admin rejects return request
   * POST /admin/rentals/:bookingId/reject-return
   */
  rejectReturn: async (
    bookingId: number,
    data: RejectReturnPayload
  ): Promise<RentalBookingItem> => {
    const res = await apiClient.post<ApiResponse<RentalBookingItem>>(
      `/admin/rentals/${bookingId}/reject-return`,
      data
    );
    return res.data.data;
  },
};
