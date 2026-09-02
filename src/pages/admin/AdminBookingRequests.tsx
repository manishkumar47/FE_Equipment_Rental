import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { bookingRequestApi } from '../../api/bookingRequest.api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/client';
import { formatDate, formatCurrency, calculateRentalDays } from '../../utils/formatters';
import type { RentalBookingItem } from '../../types/api.types';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { Card, CardHeader, CardContent } from '../../components/molecules/Card';
import { Modal } from '../../components/molecules/Modal';
import { Skeleton } from '../../components/atoms/Skeleton';
import { EmptyState } from '../../components/molecules/EmptyState';
import { Pagination } from '../../components/molecules/Pagination';
import {
  Inbox,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const AdminBookingRequests: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<RentalBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Approve state
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Reject modal state
  const [rejectingBooking, setRejectingBooking] = useState<RentalBookingItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await bookingRequestApi.getPendingRequests(page, limit, searchQuery);
      setRequests(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (booking: RentalBookingItem) => {
    setApprovingId(booking.id);
    try {
      await bookingRequestApi.approve(booking.id);
      showToast(t('BOOKING_REQUEST_APPROVED', { id: booking.id }), 'success');
      setRequests((prev) => prev.filter((r) => r.id !== booking.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg.includes('already processed') || msg.includes('409')) {
        showToast(t('BOOKING_REQUEST_ALREADY_PROCESSED'), 'warning');
        fetchRequests();
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setApprovingId(null);
    }
  };

  const handleOpenRejectModal = (booking: RentalBookingItem) => {
    setRejectingBooking(booking);
    setRejectionReason('');
  };

  const handleCloseRejectModal = () => {
    setRejectingBooking(null);
    setRejectionReason('');
  };

  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBooking) return;

    if (!rejectionReason.trim()) {
      showToast(t('BOOKING_REJECTION_REASON_REQUIRED'), 'error');
      return;
    }

    setIsSubmittingReject(true);
    try {
      await bookingRequestApi.reject(rejectingBooking.id, {
        rejectionReason: rejectionReason.trim(),
      });
      showToast(t('BOOKING_REQUEST_REJECTED', { id: rejectingBooking.id }), 'success');
      setRequests((prev) => prev.filter((r) => r.id !== rejectingBooking.id));
      setTotal((t) => Math.max(0, t - 1));
      handleCloseRejectModal();
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg.includes('already processed') || msg.includes('409')) {
        showToast(t('BOOKING_REQUEST_ALREADY_PROCESSED'), 'warning');
        handleCloseRejectModal();
        fetchRequests();
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="brand" size="sm">
              <Inbox className="w-3 h-3 mr-1" /> Approval Queue
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            Booking Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review and approve or reject new rental requests before they go active
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Requests Table Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
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

          <span className="text-xs text-slate-500 font-medium self-end sm:self-center">
            {total} pending request{total === 1 ? '' : 's'}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<Inbox className="w-6 h-6 text-slate-400" />}
              title="No Pending Requests"
              description={
                searchQuery
                  ? 'No booking requests matched your search query.'
                  : "All caught up — there's nothing waiting for approval."
              }
              actionLabel={searchQuery ? 'Clear Search' : undefined}
              onAction={() => setSearchQuery('')}
            />
          ) : (
            <>
              {/* Desktop/tablet table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Booking #</th>
                      <th className="px-5 py-3.5">Customer / User</th>
                      <th className="px-5 py-3.5">Equipment Model</th>
                      <th className="px-5 py-3.5 text-center">Qty</th>
                      <th className="px-5 py-3.5">Requested Window</th>
                      <th className="px-5 py-3.5">Est. Total</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((booking) => {
                      const days = calculateRentalDays(booking.rentFrom, booking.rentTo);
                      const price = booking.equipment?.price || 0;
                      const total = price > 0 ? days * price * booking.quantity : 0;

                      return (
                        <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-700">
                            #{booking.id}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-900">
                              {booking.user?.name || `User #${booking.userId}`}
                            </p>
                            <p className="text-[11px] text-slate-500">{booking.user?.email || '—'}</p>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-800">
                            {booking.equipment?.name || `Equipment #${booking.equipmentId}`}
                          </td>
                          <td className="px-5 py-3.5 text-center font-semibold text-slate-800">
                            {booking.quantity}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <p className="text-slate-700 font-medium">
                              {formatDate(booking.rentFrom)} &rarr; {formatDate(booking.rentTo)}
                            </p>
                            <p className="text-[11px] text-slate-400 font-normal">{days} day(s)</p>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-[#1E3A5F]">
                            {total > 0 ? formatCurrency(total) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(booking)}
                                isLoading={approvingId === booking.id}
                                disabled={approvingId !== null}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenRejectModal(booking)}
                                disabled={approvingId !== null}
                                className="text-rose-600 hover:bg-rose-50 border-slate-200"
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-slate-100">
                {requests.map((booking) => {
                  const days = calculateRentalDays(booking.rentFrom, booking.rentTo);
                  const price = booking.equipment?.price || 0;
                  const total = price > 0 ? days * price * booking.quantity : 0;

                  return (
                    <div key={booking.id} className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-700 text-xs">
                          #{booking.id}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {booking.user?.name || `User #${booking.userId}`}
                        </p>
                        <p className="text-[11px] text-slate-500">{booking.user?.email || '—'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                        <span className="text-slate-500">Equipment</span>
                        <span className="text-right font-medium text-slate-800">
                          {booking.equipment?.name || `Equipment #${booking.equipmentId}`}
                        </span>

                        <span className="text-slate-500">Qty</span>
                        <span className="text-right font-semibold text-slate-800">
                          {booking.quantity}
                        </span>

                        <span className="text-slate-500">Requested Window</span>
                        <span className="text-right text-slate-700">
                          {formatDate(booking.rentFrom)} &rarr; {formatDate(booking.rentTo)} ({days}d)
                        </span>

                        <span className="text-slate-500">Est. Total</span>
                        <span className="text-right font-bold text-[#1E3A5F]">
                          {total > 0 ? formatCurrency(total) : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(booking)}
                          isLoading={approvingId === booking.id}
                          disabled={approvingId !== null}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenRejectModal(booking)}
                          disabled={approvingId !== null}
                          className="flex-1 text-rose-600 hover:bg-rose-50 border-slate-200"
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={isLoading} />
        </CardContent>
      </Card>

      {/* Reject Modal */}
      {rejectingBooking && (
        <Modal
          isOpen={!!rejectingBooking}
          onClose={handleCloseRejectModal}
          title={`Reject Booking Request — #${rejectingBooking.id}`}
          description="Releases the stock reserved for this request."
          maxWidth="md"
        >
          <form onSubmit={handleSubmitReject} className="space-y-4">
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Rejecting will mark booking #{rejectingBooking.id} as rejected and restore the{' '}
                {rejectingBooking.quantity} unit(s) reserved for it back to available stock.
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. No stock available at pickup time, duplicate request..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseRejectModal}
                disabled={isSubmittingReject}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={isSubmittingReject}
                disabled={!rejectionReason.trim()}
              >
                Reject Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
