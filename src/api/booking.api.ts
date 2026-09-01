import { apiClient } from './client';
import type {
  ApiResponse,
  RentalBookingItem,
  CreateBookingPayload,
  PaginatedResponse,
  BookingStatus,
} from '../types/api.types';

export const bookingApi = {
  create: async (data: CreateBookingPayload): Promise<RentalBookingItem> => {
    const res = await apiClient.post<ApiResponse<RentalBookingItem>>('/rental-bookings', data);
    return res.data.data;
  },

  getAll: async (): Promise<RentalBookingItem[]> => {
    const res = await apiClient.get<ApiResponse<RentalBookingItem[]>>('/rental-bookings');
    return res.data.data || [];
  },

  /**
   * Admin views all fleet bookings across every status (paginated, with search).
   * GET /admin/rental-bookings?page=1&limit=20&search=&status=
   */
  getAllPaginated: async (
    page = 1,
    limit = 20,
    search?: string,
    status?: BookingStatus
  ): Promise<PaginatedResponse<RentalBookingItem>> => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search && search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);

    const res = await apiClient.get<ApiResponse<PaginatedResponse<RentalBookingItem>>>(
      `/admin/rental-bookings?${params.toString()}`
    );
    return res.data.data;
  },

  getMyBookings: async (): Promise<RentalBookingItem[]> => {
    const res = await apiClient.get<ApiResponse<RentalBookingItem[]>>('/rental-bookings/my');
    return res.data.data || [];
  },

  getById: async (id: number): Promise<RentalBookingItem> => {
    const res = await apiClient.get<ApiResponse<RentalBookingItem>>(`/rental-bookings/${id}`);
    return res.data.data;
  },

  delete: async (id: number): Promise<string> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/rental-bookings/${id}`);
    return res.data.message;
  },
};
