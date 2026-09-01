export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString: string | Date | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function calculateRentalDays(startDate: string | Date, endDate: string | Date): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1);
  } catch {
    return 1;
  }
}

export type BookingStatus =
  | 'REQUESTED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'UPCOMING'
  | 'OVERDUE'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'COMPLETED';

export function getBookingStatus(
  rentFrom: string,
  rentTo: string,
  dbStatus?: string | null
): BookingStatus {
  if (dbStatus === 'returned') {
    return 'RETURNED';
  }
  if (dbStatus === 'return_requested') {
    return 'RETURN_REQUESTED';
  }
  if (dbStatus === 'requested') {
    return 'REQUESTED';
  }
  if (dbStatus === 'rejected') {
    return 'REJECTED';
  }

  const now = new Date();
  const start = new Date(rentFrom);
  const end = new Date(rentTo);

  if (now < start) {
    return 'UPCOMING';
  } else if (now >= start && now <= end) {
    return 'ACTIVE';
  } else {
    return 'OVERDUE';
  }
}
