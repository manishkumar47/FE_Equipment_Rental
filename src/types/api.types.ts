export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | null;
}

export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  deletedAt?: string | null;
  isDeleted?: boolean;
}

export interface AuthSession {
  id: number;
  name: string;
  email: string;
  role: Role;
  token: string;
}

export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

export interface EquipmentItem {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  price: number;
  imageUrl?: string | null;
  equipmentCategoryId?: number;
  createdAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  category:Category 
}

export interface RentalBookingItem {
  id: number;
  rentFrom: string;
  rentTo: string;
  quantity: number;
  userId: number;
  equipmentId: number;
  isReminderSent?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
  equipment?: {
    id: number;
    name: string;
    description: string | null;
    price: number;
    quantity: number;
    imageUrl?: string | null;
  };
}

export interface CreateEquipmentPayload {
  name: string;
  description?: string;
  quantity?: number;
  price: number;
  imageUrl?: string;
  categoryId?:number
}

export interface UpdateEquipmentPayload {
  name?: string;
  description?: string | null;
  quantity?: number;
  price?: number;
  imageUrl?: string | null;
}

export interface CreateBookingPayload {
  equipmentId: number;
  quantity: number;
  rentFrom: string; // ISO format
  rentTo: string;   // ISO format
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
}
