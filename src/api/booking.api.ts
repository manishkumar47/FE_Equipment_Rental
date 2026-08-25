import { apiClient } from './client';
import type {
  ApiResponse,
  RentalBookingItem,
  CreateBookingPayload,
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
