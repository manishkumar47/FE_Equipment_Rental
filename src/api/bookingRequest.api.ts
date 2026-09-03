import { apiClient } from './client';
import type {
  ApiResponse,
  RentalBookingItem,
  PaginatedResponse,
  RejectBookingRequestPayload,
} from '../types/api.types';

export const bookingRequestApi = {
  /**
   * Admin views pending booking requests (paginated, with search)
   * GET /admin/rental-bookings/requests?page=1&limit=20&search=
   */
  getPendingRequests: async (
    page = 1,
    limit = 20,
    search?: string,
    signal?: AbortSignal
  ): Promise<PaginatedResponse<RentalBookingItem>> => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search && search.trim()) {
      params.set('search', search.trim());
    }

    const res = await apiClient.get<ApiResponse<PaginatedResponse<RentalBookingItem>>>(
      `/admin/rental-bookings/requests?${params.toString()}`,
      { signal }
    );
    return res.data.data;
  },

  /**
   * Admin approves a booking request
   * POST /admin/rental-bookings/:id/approve
   */
  approve: async (bookingId: number): Promise<RentalBookingItem> => {
    const res = await apiClient.post<ApiResponse<RentalBookingItem>>(
      `/admin/rental-bookings/${bookingId}/approve`
    );
    return res.data.data;
  },

  /**
   * Admin rejects a booking request
   * POST /admin/rental-bookings/:id/reject
   */
  reject: async (
    bookingId: number,
    data: RejectBookingRequestPayload
  ): Promise<RentalBookingItem> => {
    const res = await apiClient.post<ApiResponse<RentalBookingItem>>(
      `/admin/rental-bookings/${bookingId}/reject`,
      data
    );
    return res.data.data;
  },
};
