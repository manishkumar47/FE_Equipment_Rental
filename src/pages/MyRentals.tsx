import { URL } from '../routes/url-constant';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingApi } from '../api/booking.api';
import { returnApi } from '../api/return.api';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  calculateRentalDays,
  getBookingStatus,
} from '../utils/formatters';
import { getEquipmentIcon } from '../utils/categoryIcons';
import type { RentalBookingItem } from '../types/api.types';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Card, CardContent } from '../components/molecules/Card';
import { EmptyState } from '../components/molecules/EmptyState';
import { Skeleton } from '../components/atoms/Skeleton';
import { ConfirmDialog } from '../components/molecules/ConfirmDialog';
import { Modal } from '../components/molecules/Modal';
import {
  CalendarCheck,
  Calendar,
  Trash2,
  PackageOpen,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Eye,
  RotateCcw,
  Clock,
  CheckCircle2,
  Inbox,
  XCircle,
} from 'lucide-react';

export const MyRentals: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<RentalBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation State
  const [cancellingBooking, setCancellingBooking] = useState<RentalBookingItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Return Request State
  const [returnRequestingBooking, setReturnRequestingBooking] = useState<RentalBookingItem | null>(null);
  const [returnQuantity, setReturnQuantity] = useState('');
  const [isRequestingReturn, setIsRequestingReturn] = useState(false);

  // Details Modal State
  const [selectedBooking, setSelectedBooking] = useState<RentalBookingItem | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await bookingApi.getMyBookings();
      setBookings(items);
    } catch (err: unknown) {
      try {
        const items = await bookingApi.getAll();
        setBookings(items);
      } catch (e: unknown) {
        const msg = getErrorMessage(err || e);
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;

    setIsCancelling(true);
    try {
      await bookingApi.delete(cancellingBooking.id);
      showToast(t('BOOKING_CANCELLED_SUCCESSFULLY', { id: cancellingBooking.id }), 'success');
      setBookings((prev) => prev.filter((b) => b.id !== cancellingBooking.id));
      setCancellingBooking(null);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      showToast(msg, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const isTrackedBooking = (booking: RentalBookingItem) => (booking.trackedItemsCount ?? 0) > 0;
  const outstandingCount = (booking: RentalBookingItem) => booking.outstandingItemsCount ?? booking.quantity;

  const handleOpenReturnModal = (booking: RentalBookingItem) => {
    setReturnRequestingBooking(booking);
    setReturnQuantity(String(outstandingCount(booking)));
  };

  const handleRequestReturn = async () => {
    if (!returnRequestingBooking) return;

    const tracked = isTrackedBooking(returnRequestingBooking);
    const max = outstandingCount(returnRequestingBooking);
    let quantity: number | undefined;
    if (tracked) {
      quantity = parseInt(returnQuantity, 10);
      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > max) {
        showToast(t('RETURN_QUANTITY_INVALID', { max }), 'error');
        return;
      }
    }

    setIsRequestingReturn(true);
    try {
      const updated = await returnApi.requestReturn(returnRequestingBooking.id, quantity);
      showToast(t('RETURN_REQUEST_SUBMITTED'), 'success');
      setBookings((prev) =>
        prev.map((b) =>
          b.id === returnRequestingBooking.id
            ? { ...b, status: 'return_requested', returnRequestedAt: updated.returnRequestedAt || new Date().toISOString() }
            : b
        )
      );
      setReturnRequestingBooking(null);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      showToast(msg, 'error');
    } finally {
      setIsRequestingReturn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="brand" size="sm">
              <CalendarCheck className="w-3 h-3 mr-1" /> Active Fleet Allocations
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            My Equipment Rentals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active reservations, scheduled equipment pickups, and request returns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBookings}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Link to={URL.EQUIPMENT}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Browse Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="w-48 h-5" />
                    <Skeleton className="w-36 h-4" />
                  </div>
                </div>
                <Skeleton className="w-28 h-8" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center max-w-md mx-auto my-8">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-rose-900 mb-1">Failed to Load Rentals</h3>
          <p className="text-xs text-rose-600 mb-4">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchBookings}>
            Retry
          </Button>
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<PackageOpen className="w-7 h-7 text-slate-400" />}
          title="No Rental Bookings Found"
          description="You haven't reserved any equipment yet. Explore our high-grade inventory and schedule your first rental."
          actionLabel="Explore Equipment"
          onAction={() => window.location.assign(URL.EQUIPMENT)}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const equipmentName = booking.equipment?.name || `Equipment #${booking.equipmentId}`;
            const equipmentDesc = booking.equipment?.description || '';
            const status = getBookingStatus(booking.rentFrom, booking.rentTo);
            const days = calculateRentalDays(booking.rentFrom, booking.rentTo);
            const price = booking.equipment?.price || 0;
            const total = price > 0 ? days * price * booking.quantity : 0;

            const now = new Date();
            const rentToDate = new Date(booking.rentTo);
            const isOverdue = now > rentToDate;
            const daysOverdue = isOverdue
              ? Math.floor((now.getTime() - rentToDate.getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            const isReturned = booking.status === 'returned';
            const isReturnRequested = booking.status === 'return_requested';
            const isRequested = booking.status === 'requested';
            const isRejected = booking.status === 'rejected';
            const isActiveBooking = !booking.status || booking.status === 'active';
            const isUpcoming = status === 'UPCOMING';

            return (
              <Card
                key={booking.id}
                hoverEffect
                className="overflow-hidden border-slate-200/90"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Left: Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-[#1E3A5F] flex items-center justify-center shrink-0">
                        {getEquipmentIcon(equipmentName)}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            #{booking.id}
                          </span>
                          <h3 className="text-base font-bold text-slate-900">
                            {equipmentName}
                          </h3>

                          {/* Status Badge Hierarchy */}
                          {isRequested ? (
                            <Badge variant="brand" size="sm">
                              <Inbox className="w-3 h-3 mr-1" /> Awaiting Admin Approval
                            </Badge>
                          ) : isRejected ? (
                            <Badge variant="danger" size="sm" className="bg-rose-50 text-rose-700 border-rose-200">
                              <XCircle className="w-3 h-3 mr-1" /> Rejected
                            </Badge>
                          ) : isReturned ? (
                            <Badge variant="neutral" size="sm" className="bg-slate-100 text-slate-700">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Returned
                            </Badge>
                          ) : isReturnRequested ? (
                            <Badge variant="warning" size="sm" className="bg-amber-50 text-amber-800 border-amber-200">
                              <Clock className="w-3 h-3 mr-1 text-amber-600" /> Return Requested (Pending Verification)
                            </Badge>
                          ) : isOverdue ? (
                            <Badge variant="danger" size="sm">
                              <AlertCircle className="w-3 h-3 mr-1" /> Overdue ({daysOverdue} {daysOverdue === 1 ? 'day' : 'days'})
                            </Badge>
                          ) : isUpcoming ? (
                            <Badge variant="warning" size="sm">
                              Upcoming Reservation
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              Active Rental
                            </Badge>
                          )}
                        </div>

                        {equipmentDesc && (
                          <p className="text-xs text-slate-500 line-clamp-1">{equipmentDesc}</p>
                        )}

                        {/* Rental Duration */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {formatDate(booking.rentFrom)} &rarr; {formatDate(booking.rentTo)}
                            </span>
                            <span className="text-slate-400 font-normal">({days} days)</span>
                          </div>

                          <div className="flex items-center gap-1.5 font-medium">
                            <span>Quantity:</span>
                            <span className="font-semibold text-slate-800">
                              {booking.quantity} {booking.quantity === 1 ? 'unit' : 'units'}
                            </span>
                            {isTrackedBooking(booking) &&
                              isActiveBooking &&
                              outstandingCount(booking) < booking.quantity && (
                                <span className="text-slate-400 font-normal">
                                  ({booking.quantity - outstandingCount(booking)} returned so far,{' '}
                                  {outstandingCount(booking)} outstanding)
                                </span>
                              )}
                          </div>

                          {total > 0 && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <span>Estimated:</span>
                              <span className="font-bold text-[#1E3A5F]">
                                {formatCurrency(total)}
                              </span>
                            </div>
                          )}

                          {booking.returnCondition && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <span>Condition:</span>
                              <span className="font-semibold capitalize text-slate-700">
                                {booking.returnCondition}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                      {/* Request Return Button */}
                      {isActiveBooking && !isUpcoming && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenReturnModal(booking)}
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                          className="bg-[#1E3A5F] hover:bg-[#152843]"
                        >
                          Request Return
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBooking(booking)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Details
                      </Button>

                      {/* Cancel available while a request is pending approval, or before an upcoming rental starts */}
                      {(isRequested || (isActiveBooking && isUpcoming)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancellingBooking(booking)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          {isRequested ? 'Withdraw Request' : 'Cancel'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Reference #${selectedBooking.id}`}
          description="Detailed reservation summary and status overview"
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold capitalize text-slate-800">
                  {selectedBooking.status === 'return_requested'
                    ? 'Return Requested'
                    : selectedBooking.status === 'returned'
                    ? 'Returned'
                    : selectedBooking.status === 'requested'
                    ? 'Awaiting Admin Approval'
                    : selectedBooking.status === 'rejected'
                    ? 'Rejected'
                    : getBookingStatus(
                        selectedBooking.rentFrom,
                        selectedBooking.rentTo,
                        selectedBooking.status
                      )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Equipment Model:</span>
                <span className="font-semibold text-slate-800">
                  {selectedBooking.equipment?.name || `ID #${selectedBooking.equipmentId}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Units Reserved:</span>
                <span className="font-semibold text-slate-800">
                  {selectedBooking.quantity} unit(s)
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Date:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateTime(selectedBooking.rentFrom)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Return Date:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateTime(selectedBooking.rentTo)}
                </span>
              </div>

              {selectedBooking.returnRequestedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Return Requested At:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(selectedBooking.returnRequestedAt)}
                  </span>
                </div>
              )}

              {selectedBooking.returnedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Returned At:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(selectedBooking.returnedAt)}
                  </span>
                </div>
              )}

              {selectedBooking.returnCondition && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified Condition:</span>
                  <span className="font-semibold capitalize text-slate-800">
                    {selectedBooking.returnCondition}
                  </span>
                </div>
              )}

              {selectedBooking.conditionNotes && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin Notes:</span>
                  <span className="text-slate-700 italic">
                    {selectedBooking.conditionNotes}
                  </span>
                </div>
              )}

              {selectedBooking.rejectionReason && (
                <div className="flex justify-between text-rose-700">
                  <span>Rejection Reason:</span>
                  <span className="font-medium">
                    {selectedBooking.rejectionReason}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-800">
                  {calculateRentalDays(selectedBooking.rentFrom, selectedBooking.rentTo)} days
                </span>
              </div>

              {selectedBooking.equipment?.price && (
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-sm">
                  <span>Rental Cost:</span>
                  <span className="text-emerald-700">
                    {formatCurrency(
                      calculateRentalDays(selectedBooking.rentFrom, selectedBooking.rentTo) *
                        selectedBooking.equipment.price *
                        selectedBooking.quantity
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Return Request — plain confirm for untracked equipment */}
      {returnRequestingBooking && !isTrackedBooking(returnRequestingBooking) && (
        <ConfirmDialog
          isOpen={!!returnRequestingBooking}
          onClose={() => setReturnRequestingBooking(null)}
          onConfirm={handleRequestReturn}
          title="Confirm Return Request"
          message={`Are you ready to initiate the return process for "${
            returnRequestingBooking.equipment?.name || 'this equipment'
          }" (Booking #${returnRequestingBooking.id})? An administrator will inspect the equipment condition and finalize the return.`}
          confirmText="Yes, Request Return"
          cancelText="Not Now"
          variant="primary"
          isLoading={isRequestingReturn}
        />
      )}

      {/* Return Request — quantity picker for individually tracked equipment */}
      {returnRequestingBooking && isTrackedBooking(returnRequestingBooking) && (
        <Modal
          isOpen={!!returnRequestingBooking}
          onClose={() => setReturnRequestingBooking(null)}
          title="Request Return"
          description={`Booking #${returnRequestingBooking.id} — ${
            returnRequestingBooking.equipment?.name || 'this equipment'
          }`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-left">
            <p className="text-xs text-slate-600 leading-relaxed">
              You have {outstandingCount(returnRequestingBooking)} unit(s) still with you. Choose how
              many you're returning now — you can return the rest later in a separate request.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">Quantity to return</label>
              <input
                type="number"
                min={1}
                max={outstandingCount(returnRequestingBooking)}
                value={returnQuantity}
                onChange={(e) => setReturnQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturnRequestingBooking(null)}
                disabled={isRequestingReturn}
              >
                Not Now
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequestReturn}
                isLoading={isRequestingReturn}
                className="bg-[#1E3A5F] hover:bg-[#152843]"
              >
                Request Return
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancellingBooking && (
        <ConfirmDialog
          isOpen={!!cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onConfirm={handleCancelBooking}
          title="Cancel Rental Booking"
          message={`Are you sure you want to cancel booking #${cancellingBooking.id} for ${
            cancellingBooking.equipment?.name || 'this equipment'
          }? This action will release the reserved stock immediately.`}
          confirmText="Yes, Cancel Booking"
          cancelText="Keep Booking"
          variant="danger"
          isLoading={isCancelling}
        />
      )}
    </div>
  );
};

