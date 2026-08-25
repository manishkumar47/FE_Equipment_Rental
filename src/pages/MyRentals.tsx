import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../api/booking.api';
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
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import {
  CalendarCheck,
  Calendar,
  Trash2,
  PackageOpen,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const MyRentals: React.FC = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<RentalBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation State
  const [cancellingBooking, setCancellingBooking] = useState<RentalBookingItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Details Modal State
  const [selectedBooking, setSelectedBooking] = useState<RentalBookingItem | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch user's bookings
      const items = await bookingApi.getMyBookings();
      setBookings(items);
    } catch (err: unknown) {
      // Fallback: try getAll if my endpoint not supported
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
      showToast(`Booking #${cancellingBooking.id} cancelled successfully`, 'success');
      setBookings((prev) => prev.filter((b) => b.id !== cancellingBooking.id));
      setCancellingBooking(null);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      showToast(msg, 'error');
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
              <CalendarCheck className="w-3 h-3 mr-1" /> Active Fleet Allocations
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            My Equipment Rentals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active reservations, scheduled equipment pickups, and historical rental orders
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
          <Link to="/equipment">
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
          onAction={() => window.location.assign('/equipment')}
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

            const isUpcoming = status === 'UPCOMING';
            const isActive = status === 'ACTIVE';

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
                          <Badge
                            variant={
                              isActive ? 'success' : isUpcoming ? 'warning' : 'neutral'
                            }
                            size="sm"
                          >
                            {status === 'ACTIVE'
                              ? 'Active Rental'
                              : status === 'UPCOMING'
                              ? 'Upcoming Reservation'
                              : 'Rental Completed'}
                          </Badge>
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
                          </div>

                          {total > 0 && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <span>Estimated:</span>
                              <span className="font-bold text-[#1E3A5F]">
                                {formatCurrency(total)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBooking(booking)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Details
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancellingBooking(booking)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Cancel
                      </Button>
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
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge
                  variant={
                    getBookingStatus(selectedBooking.rentFrom, selectedBooking.rentTo) === 'ACTIVE'
                      ? 'success'
                      : 'warning'
                  }
                  size="sm"
                >
                  {getBookingStatus(selectedBooking.rentFrom, selectedBooking.rentTo)}
                </Badge>
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

              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-800">
                  {calculateRentalDays(selectedBooking.rentFrom, selectedBooking.rentTo)} days
                </span>
              </div>

              {selectedBooking.equipment?.price && (
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-sm">
                  <span>Total Cost:</span>
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
