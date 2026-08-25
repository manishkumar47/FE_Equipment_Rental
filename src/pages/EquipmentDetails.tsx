import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { equipmentApi } from '../api/equipment.api';
import { bookingApi } from '../api/booking.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import { formatCurrency, calculateRentalDays } from '../utils/formatters';
import { getEquipmentIcon } from '../utils/categoryIcons';
import type { EquipmentItem } from '../types/api.types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import {
  ArrowLeft,
  ShieldCheck,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

export const EquipmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [equipment, setEquipment] = useState<EquipmentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form State
  const [quantity, setQuantity] = useState(1);
  const [rentFrom, setRentFrom] = useState('');
  const [rentTo, setRentTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    id: number;
    days: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    // Default dates: tomorrow to +2 days
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);

    setRentFrom(tomorrow.toISOString().slice(0, 16));
    setRentTo(dayAfter.toISOString().slice(0, 16));
  }, []);

  const fetchEquipment = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      // Try getById endpoint first
      const item = await equipmentApi.getById(Number(id));
      setEquipment(item);
    } catch {
      // Fallback: fetch all and find
      try {
        const all = await equipmentApi.getAll();
        const found = all.find((eq) => eq.id === Number(id));
        if (found) {
          setEquipment(found);
        } else {
          setError('Equipment item not found.');
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [id]);

  const rentalDays = rentFrom && rentTo ? calculateRentalDays(rentFrom, rentTo) : 1;
  const estimatedTotal = equipment ? rentalDays * equipment.price * quantity : 0;

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast('Please sign in to rent equipment', 'info');
      navigate('/login', { state: { from: { pathname: `/equipment/${id}` } } });
      return;
    }

    if (!equipment) return;

    if (!rentFrom || !rentTo) {
      showToast('Please select valid rental start and end dates', 'error');
      return;
    }

    const start = new Date(rentFrom);
    const end = new Date(rentTo);

    if (end <= start) {
      showToast('Rental end date must be after start date', 'error');
      return;
    }

    if (start < new Date()) {
      showToast('Start date must be in the future', 'error');
      return;
    }

    if (quantity > equipment.quantity) {
      showToast(`Only ${equipment.quantity} units are available`, 'error');
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleFinalSubmit = async () => {
    if (!equipment) return;

    setIsSubmitting(true);
    try {
      const result = await bookingApi.create({
        equipmentId: equipment.id,
        quantity,
        rentFrom: new Date(rentFrom).toISOString(),
        rentTo: new Date(rentTo).toISOString(),
      });

      setBookingResult({
        id: result.id,
        days: rentalDays,
        total: estimatedTotal,
      });

      setEquipment((prev) =>
        prev ? { ...prev, quantity: Math.max(0, prev.quantity - quantity) } : null
      );

      setIsConfirmModalOpen(false);
      showToast('Rental confirmed successfully!', 'success');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" label="Loading equipment specifications..." />
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Equipment Not Found</h2>
        <p className="text-xs text-slate-500">
          {error || 'The requested equipment does not exist or has been retired.'}
        </p>
        <Link to="/equipment">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  const isAvailable = equipment.quantity > 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/equipment"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Equipment Catalog
        </Link>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Equipment Details & Specs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
            {/* Header info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#1E3A5F]/10 border border-[#1E3A5F]/20 text-[#1E3A5F] flex items-center justify-center shrink-0 overflow-hidden">
                  {equipment.imageUrl ? (
                    <img
                      src={equipment.imageUrl}
                      alt={equipment.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    getEquipmentIcon(equipment.name)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={isAvailable ? 'success' : 'danger'} size="sm">
                      {isAvailable ? `${equipment.quantity} Units Available` : 'Out of Stock'}
                    </Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                    {equipment.name}
                  </h1>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-slate-100 pt-6">
              <h2 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2">
                Equipment Description & Specifications
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {equipment.description ||
                  'Professional equipment unit fully verified, tested, and maintained to manufacturer specifications. Ready for production deployment with standard accessories.'}
              </p>
            </div>

            {/* Verification and Assurance block */}
            <div className="border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Quality Certified</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Inspected for operational safety and cleaned before dispatch.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-[#1E3A5F] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Flexible Extensions</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Seamless return or rental period extensions via support console.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rental Booking Calculator Panel (5 cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <Card className="shadow-xs border-slate-200">
            <CardContent className="p-6 space-y-5">
              {/* Daily Rate Header */}
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block tracking-wider">
                    Rental Rate
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-bold text-slate-900">
                      {formatCurrency(equipment.price)}
                    </span>
                    <span className="text-xs text-slate-500">/ day</span>
                  </div>
                </div>

                <Badge variant={isAvailable ? 'brand' : 'neutral'} size="md">
                  {isAvailable ? 'Immediate Dispatch' : 'Unavailable'}
                </Badge>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleOpenConfirm} className="space-y-4">
                {/* Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Quantity to Rent
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Max: {equipment.quantity}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, equipment.quantity)}
                    value={quantity}
                    disabled={!isAvailable}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(
                          1,
                          Math.min(equipment.quantity, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                    className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                {/* Rental Duration Dates */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Rent From (Pickup)
                    </label>
                    <input
                      type="datetime-local"
                      value={rentFrom}
                      disabled={!isAvailable}
                      onChange={(e) => setRentFrom(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Rent To (Return)
                    </label>
                    <input
                      type="datetime-local"
                      value={rentTo}
                      disabled={!isAvailable}
                      onChange={(e) => setRentTo(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                    />
                  </div>
                </div>

                {/* Live Cost Estimation Summary */}
                {isAvailable && rentFrom && rentTo && (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Duration:</span>
                      <span className="font-semibold text-slate-800">{rentalDays} day(s)</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Rate Calculation:</span>
                      <span className="font-semibold text-slate-800">
                        {quantity} &times; {formatCurrency(equipment.price)} &times; {rentalDays}d
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2 text-sm">
                      <span>Total Estimated:</span>
                      <span className="text-[#1E3A5F]">{formatCurrency(estimatedTotal)}</span>
                    </div>
                  </div>
                )}

                {/* Submit CTA */}
                <Button
                  type="submit"
                  variant={isAvailable ? 'primary' : 'secondary'}
                  size="lg"
                  disabled={!isAvailable}
                  className="w-full font-semibold shadow-xs"
                  leftIcon={<PackageCheck className="w-5 h-5" />}
                >
                  {isAvailable ? 'Proceed to Rental Confirmation' : 'Currently Out of Stock'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review & Confirm Modal */}
      {isConfirmModalOpen && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Review Rental Details"
          description="Please verify your equipment reservation details before confirming"
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Equipment:</span>
                <span className="font-bold text-slate-900">{equipment.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Units:</span>
                <span className="font-semibold text-slate-800">{quantity} unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rental Start:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(rentFrom).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rental End:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(rentTo).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Calculated Days:</span>
                <span className="font-semibold text-slate-800">{rentalDays} day(s)</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2.5 font-bold text-slate-900 text-sm">
                <span>Total Amount:</span>
                <span className="text-[#1E3A5F]">{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleFinalSubmit}
                isLoading={isSubmitting}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm & Book
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Booking Result Success Dialog */}
      {bookingResult && (
        <Modal
          isOpen={!!bookingResult}
          onClose={() => setBookingResult(null)}
          title="Rental Confirmed!"
          maxWidth="md"
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Reservation Reference
              </p>
              <p className="text-xl font-mono font-bold text-slate-900">
                #{bookingResult.id}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Equipment:</span>
                <span className="font-semibold text-slate-800">{equipment.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity Reserved:</span>
                <span className="font-semibold text-slate-800">{quantity} unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-800">{bookingResult.days} day(s)</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-sm">
                <span>Total Amount:</span>
                <span className="text-emerald-700">{formatCurrency(bookingResult.total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-1/2"
                onClick={() => setBookingResult(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-1/2"
                onClick={() => {
                  setBookingResult(null);
                  navigate('/rentals');
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View My Rentals
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
