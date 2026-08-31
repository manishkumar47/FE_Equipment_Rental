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
  /** Derived from registered physical units (see EquipmentUnit). Informational only —
   * `quantity` above remains the source of truth for booking availability. */
  totalItemCount?: number;
  availableItemCount?: number;
}

/**
 * A single physical/serialized unit ("copy") of an EquipmentItem model, e.g. one
 * specific drill with its own asset tag. Lets admins track condition/loss/damage
 * per physical unit instead of only an aggregate `quantity` count.
 */
export type EquipmentUnitStatus =
  | 'available'
  | 'rented'
  | 'under_repair'
  | 'damaged'
  | 'lost'
  | 'retired';

export interface EquipmentUnit {
  id: number;
  equipmentId: number;
  serialNumber: string;
  status: EquipmentUnitStatus;
  conditionNotes?: string | null;
  createdAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export interface CreateEquipmentUnitPayload {
  serialNumber: string;
  status?: EquipmentUnitStatus;
  conditionNotes?: string;
}

export interface BulkCreateEquipmentUnitPayload {
  items: CreateEquipmentUnitPayload[];
}

export interface UpdateEquipmentUnitPayload {
  serialNumber?: string;
  status?: EquipmentUnitStatus;
  conditionNotes?: string;
}

export interface RentalBookingItem {
  id: number;
  rentFrom: string;
  rentTo: string;
  quantity: number;
  userId: number;
  equipmentId: number;
  status?: 'active' | 'return_requested' | 'returned';
  returnRequestedAt?: string | null;
  returnedAt?: string | null;
  returnCondition?: 'good' | 'damaged' | 'lost' | null;
  conditionNotes?: string | null;
  rejectionReason?: string | null;
  computedStatus?: string;
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
  categoryId?: number;
}

export interface BulkCreateEquipmentItem {
  name: string;
  description?: string;
  quantity?: number;
  price: number;
  imageUrl?: string;
  categoryId: number;
}

export interface BulkCreateEquipmentPayload {
  items: BulkCreateEquipmentItem[];
}

export interface BulkCreateEquipmentResponse {
  created: EquipmentItem[];
  count: number;
}

export interface UpdateEquipmentPayload {
  name?: string;
  description?: string | null;
  quantity?: number;
  price?: number;
  imageUrl?: string | null;
  categoryId?: number;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConfirmReturnPayload {
  condition: 'good' | 'damaged' | 'lost';
  conditionNotes?: string;
  damageFee?: number;
}

export interface FineBreakdown {
  id?: number;
  totalFine: number;
  lateFee: number;
  conditionFee: number;
  daysLate: number;
  breakdown: {
    lateFee: number;
    damageFee: number;
    replacementCost: number;
  };
}

export interface ConfirmReturnResponse {
  booking: RentalBookingItem;
  fine: FineBreakdown | null;
}

export interface RejectReturnPayload {
  rejectionReason: string;
}

