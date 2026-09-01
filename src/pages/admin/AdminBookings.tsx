import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { bookingApi } from '../../api/booking.api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/client';
import {
  formatDate,
  formatCurrency,
  calculateRentalDays,
  getBookingStatus,
} from '../../utils/formatters';
import type { BookingStatus, RentalBookingItem } from '../../types/api.types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import {
  CalendarCheck,
  Search,
  RefreshCw,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Inbox,
  XCircle,
} from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<RentalBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BookingStatus>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Cancel / Delete State
  const [cancellingBooking, setCancellingBooking] = useState<RentalBookingItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await bookingApi.getAllPaginated(
        page,
        limit,
        searchQuery,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setBookings(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter, showToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings;

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;

    setIsCancelling(true);
    try {
      await bookingApi.delete(cancellingBooking.id);
      showToast(t('BOOKING_CANCELLED_SUCCESSFULLY', { id: cancellingBooking.id }), 'success');
      setCancellingBooking(null);
      // If this was the last item on a page beyond the first, step back a page.
      if (bookings.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await fetchBookings();
      }
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="brand" size="sm">
              <CalendarCheck className="w-3 h-3 mr-1" /> Operations Ledger
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            All Fleet Bookings & Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor company-wide equipment reservations, customer assignments, and schedule completions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBookings()}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Bookings Table Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-lg">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer, equipment, or booking #..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-3 py-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="requested">Awaiting Approval</option>
                <option value="rejected">Rejected</option>
                <option value="active">Active (incl. upcoming &amp; overdue)</option>
                <option value="return_requested">Return Requested</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-medium self-end sm:self-center">
            {total} total entries
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="w-6 h-6 text-slate-400" />}
              title="No Bookings Found"
              description={
                searchQuery || statusFilter !== 'ALL'
                  ? 'No rental orders matched your filters.'
                  : 'No bookings recorded in the system yet.'
              }
              actionLabel={searchQuery || statusFilter !== 'ALL' ? 'Reset Filters' : undefined}
              onAction={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setPage(1);
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Booking #</th>
                    <th className="px-5 py-3.5">Customer / User</th>
                    <th className="px-5 py-3.5">Equipment Model</th>
                    <th className="px-5 py-3.5 text-center">Qty</th>
                    <th className="px-5 py-3.5">Rental Duration</th>
                    <th className="px-5 py-3.5">Est. Total</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => {
                    const status = getBookingStatus(b.rentFrom, b.rentTo, b.status);
                    const days = calculateRentalDays(b.rentFrom, b.rentTo);
                    const price = b.equipment?.price || 0;
                    const total = price > 0 ? days * price * b.quantity : 0;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-600">
                          #{b.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">
                            {b.user?.name || `User #${b.userId}`}
                          </p>
                          <p className="text-[11px] text-slate-500">{b.user?.email || '—'}</p>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">
                          {b.equipment?.name || `Equipment #${b.equipmentId}`}
                        </td>
                        <td className="px-5 py-3.5 text-center font-semibold text-slate-800">
                          {b.quantity}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-slate-700 font-medium">
                            {formatDate(b.rentFrom)} &rarr; {formatDate(b.rentTo)}
                          </p>
                          <p className="text-[11px] text-slate-400 font-normal">{days} day(s)</p>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-[#1E3A5F]">
                          {total > 0 ? formatCurrency(total) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {status === 'REQUESTED' ? (
                            <Badge variant="brand" size="sm">
                              <Inbox className="w-3 h-3 mr-1" />
                              AWAITING APPROVAL
                            </Badge>
                          ) : status === 'REJECTED' ? (
                            <Badge variant="danger" size="sm" className="bg-rose-50 text-rose-700 border-rose-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              REJECTED
                            </Badge>
                          ) : status === 'RETURNED' ? (
                            <Badge variant="neutral" size="sm" className="bg-slate-100 text-slate-700 border-slate-200">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                              RETURNED
                            </Badge>
                          ) : status === 'RETURN_REQUESTED' ? (
                            <Badge variant="warning" size="sm" className="bg-amber-50 text-amber-800 border-amber-200">
                              <Clock className="w-3 h-3 mr-1 text-amber-600" />
                              RETURN REQUESTED
                            </Badge>
                          ) : status === 'OVERDUE' ? (
                            <Badge variant="danger" size="sm" className="bg-rose-50 text-rose-700 border-rose-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              OVERDUE
                            </Badge>
                          ) : status === 'ACTIVE' ? (
                            <Badge variant="success" size="sm">
                              ACTIVE
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              UPCOMING
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {status !== 'RETURNED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancellingBooking(b)}
                              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              aria-label="Cancel booking"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={isLoading} />
        </CardContent>
      </Card>

      {/* Cancel / Delete Confirmation */}
      {cancellingBooking && (
        <ConfirmDialog
          isOpen={!!cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onConfirm={handleCancelBooking}
          title="Cancel Booking"
          message={`Are you sure you want to cancel booking #${cancellingBooking.id} for ${
            cancellingBooking.equipment?.name || 'this equipment'
          }? This will release the allocated units.`}
          confirmText="Yes, Cancel Booking"
          variant="danger"
          isLoading={isCancelling}
        />
      )}
    </div>
  );
};
