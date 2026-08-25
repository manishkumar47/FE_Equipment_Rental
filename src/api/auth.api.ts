import { apiClient } from './client';
import type { ApiResponse, AuthSession } from '../types/api.types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthSession> => {
    const res = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', {
      email,
      password,
    });
    return res.data.data;
  },

  signup: async (name: string, email: string, password: string): Promise<unknown> => {
    const res = await apiClient.post<ApiResponse<unknown>>('/auth/signup', {
      name,
      email,
      password,
    });
    return res.data.data;
  },

  signupInitiate: async (
    name: string,
    email: string,
    password: string,
  ): Promise<string> => {
    const res = await apiClient.post<ApiResponse<null>>('/auth/signup/initiate', {
      name,
      email,
      password,
    });
    return res.data.message;
  },

  signupResend: async (email: string): Promise<string> => {
    const res = await apiClient.post<ApiResponse<null>>('/auth/signup/resend', {
      email,
    });
    return res.data.message;
  },

  signupVerify: async (email: string, otp: string): Promise<AuthSession> => {
    const res = await apiClient.post<ApiResponse<AuthSession>>(
      '/auth/signup/verify',
      {
        email,
        otp,
      },
    );
    return res.data.data;
  },

  forgotPassword: async (email: string): Promise<string> => {
    const res = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', {
      email,
    });
    return res.data.message;
  },

  resetPassword: async (password: string, token: string): Promise<string> => {
    const res = await apiClient.post<ApiResponse<null>>('/auth/reset-password', {
      password,
      token,
    });
    return res.data.message;
  },
};
