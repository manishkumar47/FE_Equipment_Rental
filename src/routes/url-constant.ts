export const URL = {
  HOME: '/',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // User
  EQUIPMENT: '/equipment',
  EQUIPMENT_DETAILS: (id: string | number) => `/equipment/${id}`,
  RENTALS: '/rentals',
  FINES: '/fines',
  PROFILE: '/profile',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_EQUIPMENT: '/admin/equipment',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_BOOKING_REQUESTS: '/admin/booking-requests',
  ADMIN_RETURNS: '/admin/returns',
  ADMIN_USERS: '/admin/users',

  NOT_FOUND: '*',
} as const;

export const EQUIPMENT_DETAILS_PATTERN = '/equipment/:id';
