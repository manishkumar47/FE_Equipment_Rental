import React, { useState, useEffect, useCallback } from 'react';
import { returnApi } from '../../api/return.api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/client';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  calculateRentalDays,
} from '../../utils/formatters';
import type {
  RentalBookingItem,
  ConfirmReturnResponse,
} from '../../types/api.types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  RotateCcw,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const AdminReturns: React.FC = () => {
  const { showToast } = useToast();
  const [returnRequests, setReturnRequests] = useState<RentalBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Confirm Return Modal State
  const [confirmingBooking, setConfirmingBooking] = useState<RentalBookingItem | null>(null);
  const [condition, setCondition] = useState<'good' | 'damaged' | 'lost' | ''>('');
  const [damagePreset, setDamagePreset] = useState<'25' | '50' | 'custom'>('25');
  const [customDamageFee, setCustomDamageFee] = useState<string>('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  // Authoritative Fine Success Modal State
  const [completedReturnData, setCompletedReturnData] = useState<ConfirmReturnResponse | null>(null);

  // Reject Return Modal State
  const [rejectingBooking, setRejectingBooking] = useState<RentalBookingItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await returnApi.getPendingReturnRequests(page, limit, searchQuery);
      setReturnRequests(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, showToast]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  // Open Confirm Modal
  const handleOpenConfirmModal = (booking: RentalBookingItem) => {
    setConfirmingBooking(booking);
    setCondition('');
    setDamagePreset('25');
    setCustomDamageFee('');
    setConditionNotes('');
  };

  // Close Confirm Modal
  const handleCloseConfirmModal = () => {
    setConfirmingBooking(null);
    setCondition('');
    setDamagePreset('25');
    setCustomDamageFee('');
    setConditionNotes('');
  };

  // Calculate live damage fee number based on selection
  const getSelectedDamageFee = (): number | undefined => {
    if (condition !== 'damaged' || !confirmingBooking?.equipment?.price) return undefined;
    const price = confirmingBooking.equipment.price;
    if (damagePreset === '25') return Math.round(price * 0.25);
    if (damagePreset === '50') return Math.round(price * 0.5);
    if (damagePreset === 'custom') {
      const num = parseFloat(customDamageFee);
      return isNaN(num) || num <= 0 ? 0 : num;
    }
    return undefined;
  };

  // Calculate estimated fine components for live preview
  const calculateEstimatedFine = () => {
    if (!confirmingBooking) return { lateFee: 0, conditionFee: 0, totalEstimate: 0, daysLate: 0 };

    const now = new Date();
    const rentToDate = new Date(confirmingBooking.rentTo);
    const diffMs = now.getTime() - rentToDate.getTime();
    const daysLate = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;

    // Late fee tiers: ₹100/day for 1-7, ₹200/day for 8-14, capped at day 14 (max ₹2,100)
    let lateFee = 0;
    if (daysLate > 0) {
      const tier1 = Math.min(daysLate, 7) * 100;
      const tier2 = Math.max(0, Math.min(daysLate, 14) - 7) * 200;
      lateFee = tier1 + tier2;
    }

    let conditionFee = 0;
    const equipmentPrice = confirmingBooking.equipment?.price || 0;
    if (condition === 'damaged') {
      conditionFee = getSelectedDamageFee() || 0;
    } else if (condition === 'lost') {
      conditionFee = equipmentPrice * confirmingBooking.quantity;
    }

    return {
      lateFee,
      conditionFee,
      totalEstimate: lateFee + conditionFee,
      daysLate,
    };
  };

  // Submit Confirm Return
  const handleSubmitConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingBooking) return;

    if (!condition) {
      showToast('Please select the returned equipment condition.', 'error');
      return;
    }

    let damageFeeToSend: number | undefined;
    if (condition === 'damaged') {
      damageFeeToSend = getSelectedDamageFee();
      const maxFee = (confirmingBooking.equipment?.price || 0) * 1.5;
      if (!damageFeeToSend || damageFeeToSend <= 0) {
        showToast('Please enter a valid positive damage fee.', 'error');
        return;
      }
      if (damageFeeToSend > maxFee) {
        showToast(`Damage fee cannot exceed 1.5x equipment price (${formatCurrency(maxFee)}).`, 'error');
        return;
      }
    }

    setIsSubmittingConfirm(true);
    try {
      const result = await returnApi.confirmReturn(confirmingBooking.id, {
        condition,
        conditionNotes: conditionNotes.trim() || undefined,
        damageFee: damageFeeToSend,
      });

      handleCloseConfirmModal();
      setCompletedReturnData(result);
      fetchReturns();
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg.includes('already processed') || msg.includes('409')) {
        showToast('This return was already processed by another administrator.', 'warning');
        handleCloseConfirmModal();
        fetchReturns();
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (booking: RentalBookingItem) => {
    setRejectingBooking(booking);
    setRejectionReason('');
  };

  // Close Reject Modal
  const handleCloseRejectModal = () => {
    setRejectingBooking(null);
    setRejectionReason('');
  };

  // Submit Reject Return
  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBooking) return;

    if (!rejectionReason.trim()) {
      showToast('Please provide a reason for rejecting the return request.', 'error');
      return;
    }

    setIsSubmittingReject(true);
    try {
      await returnApi.rejectReturn(rejectingBooking.id, {
        rejectionReason: rejectionReason.trim(),
      });
      showToast(`Return request for Booking #${rejectingBooking.id} rejected.`, 'success');
      handleCloseRejectModal();
      fetchReturns();
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg.includes('already processed') || msg.includes('409')) {
        showToast('This return was already processed by another administrator.', 'warning');
        handleCloseRejectModal();
        fetchReturns();
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const estimatedFine = calculateEstimatedFine();
  const maxAllowableDamageFee = (confirmingBooking?.equipment?.price || 0) * 1.5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="brand" size="sm">
              <ShieldCheck className="w-3 h-3 mr-1" /> Returns & Stock Settlement
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            Equipment Return Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify returned hardware condition, assess damage/late fines, and restore available stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReturns}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          {/* Search bar */}
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
            {total} pending verification{total === 1 ? '' : 's'}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          ) : returnRequests.length === 0 ? (
            <EmptyState
              icon={<RotateCcw className="w-6 h-6 text-slate-400" />}
              title="No Pending Return Requests"
              description={
                searchQuery
                  ? 'No return requests matched your search query.'
                  : 'All equipment returns have been verified and settled. Great job!'
              }
              actionLabel={searchQuery ? 'Clear Search' : undefined}
              onAction={() => setSearchQuery('')}
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
                    <th className="px-5 py-3.5">Rental Window</th>
                    <th className="px-5 py-3.5">Requested At</th>
                    <th className="px-5 py-3.5">Days Late / Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnRequests.map((booking) => {
                    const now = new Date();
                    const rentToDate = new Date(booking.rentTo);
                    const isOverdue = now > rentToDate;
                    const diffMs = now.getTime() - rentToDate.getTime();
                    const daysLate = isOverdue ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
                    const days = calculateRentalDays(booking.rentFrom, booking.rentTo);

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
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-800">
                            {booking.equipment?.name || `Equipment #${booking.equipmentId}`}
                          </p>
                          {booking.equipment?.price && (
                            <p className="text-[11px] text-slate-400">
                              Unit Price: {formatCurrency(booking.equipment.price)}
                            </p>
                          )}
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
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                          {formatDateTime(booking.returnRequestedAt || undefined)}
                        </td>
                        <td className="px-5 py-3.5">
                          {daysLate > 0 ? (
                            <Badge variant="danger" size="sm" className="bg-rose-50 text-rose-700 border-rose-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {daysLate} {daysLate === 1 ? 'day' : 'days'} late
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              On Schedule
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenConfirmModal(booking)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Verify & Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRejectModal(booking)}
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
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalPages}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Return Modal */}
      {confirmingBooking && (
        <Modal
          isOpen={!!confirmingBooking}
          onClose={handleCloseConfirmModal}
          title={`Confirm Equipment Return — #${confirmingBooking.id}`}
          description="Inspect equipment physical condition, assess fees, and settle inventory stock."
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitConfirm} className="space-y-4">
            {/* Booking Summary Box */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">
                  {confirmingBooking.user?.name} ({confirmingBooking.user?.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Equipment:</span>
                <span className="font-semibold text-slate-800">
                  {confirmingBooking.equipment?.name} &times; {confirmingBooking.quantity} unit(s)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Return:</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(confirmingBooking.rentTo)}
                </span>
              </div>
              {estimatedFine.daysLate > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Lateness:</span>
                  <span>{estimatedFine.daysLate} day(s) overdue</span>
                </div>
              )}
            </div>

            {/* Condition Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Equipment Condition <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'good', label: 'Good / Normal', desc: 'No damage, restock full quantity' },
                  { id: 'damaged', label: 'Damaged', desc: 'Restock item + apply damage fee' },
                  { id: 'lost', label: 'Lost / Unreturned', desc: 'Charge replacement, no restock' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCondition(item.id as typeof condition);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      condition === item.id
                        ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 ring-2 ring-[#1E3A5F]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        condition === item.id ? 'text-[#1E3A5F]' : 'text-slate-800'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Damage Fee Section (Shown only if condition === 'damaged') */}
            {condition === 'damaged' && (
              <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Damage Fee Assessment <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Max allowable: <span className="font-semibold">{formatCurrency(maxAllowableDamageFee)}</span> (1.5&times; price)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDamagePreset('25')}
                    className={`p-2 rounded-md border text-center transition-colors cursor-pointer ${
                      damagePreset === '25'
                        ? 'bg-white border-[#1E3A5F] ring-1 ring-[#1E3A5F] font-bold text-[#1E3A5F]'
                        : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <p className="text-xs">25% of Price</p>
                    <p className="text-[10px] font-semibold text-slate-500">
                      {formatCurrency((confirmingBooking.equipment?.price || 0) * 0.25)}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDamagePreset('50')}
                    className={`p-2 rounded-md border text-center transition-colors cursor-pointer ${
                      damagePreset === '50'
                        ? 'bg-white border-[#1E3A5F] ring-1 ring-[#1E3A5F] font-bold text-[#1E3A5F]'
                        : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <p className="text-xs">50% of Price</p>
                    <p className="text-[10px] font-semibold text-slate-500">
                      {formatCurrency((confirmingBooking.equipment?.price || 0) * 0.5)}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDamagePreset('custom')}
                    className={`p-2 rounded-md border text-center transition-colors cursor-pointer ${
                      damagePreset === 'custom'
                        ? 'bg-white border-[#1E3A5F] ring-1 ring-[#1E3A5F] font-bold text-[#1E3A5F]'
                        : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <p className="text-xs">Custom Amount</p>
                    <p className="text-[10px] text-slate-500">Enter value</p>
                  </button>
                </div>

                {damagePreset === 'custom' && (
                  <div>
                    <input
                      type="number"
                      min="1"
                      max={maxAllowableDamageFee}
                      step="1"
                      placeholder={`Enter amount in ₹ (max ${maxAllowableDamageFee})`}
                      value={customDamageFee}
                      onChange={(e) => setCustomDamageFee(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                    />
                    {parseFloat(customDamageFee) > maxAllowableDamageFee && (
                      <p className="text-[11px] text-rose-600 mt-1">
                        Amount exceeds the maximum limit of {formatCurrency(maxAllowableDamageFee)}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Condition Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Condition Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Add any verification observations, damage description, or serial check notes..."
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>

            {/* Live Fine Estimate Preview */}
            <div className="p-3.5 rounded-lg bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Estimated Fine Breakdown
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                  Estimate (Subject to DB Confirmation)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-400">Late Fee</p>
                  <p className="font-semibold text-slate-200">
                    {formatCurrency(estimatedFine.lateFee)}
                  </p>
                  {estimatedFine.daysLate > 0 && (
                    <p className="text-[9px] text-slate-400">
                      ({estimatedFine.daysLate}d late &bull; max ₹2,100)
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">
                    {condition === 'lost' ? 'Replacement' : 'Damage Fee'}
                  </p>
                  <p className="font-semibold text-slate-200">
                    {formatCurrency(estimatedFine.conditionFee)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Total Est. Fine</p>
                  <p className="text-sm font-bold text-emerald-400">
                    {formatCurrency(estimatedFine.totalEstimate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseConfirmModal}
                disabled={isSubmittingConfirm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingConfirm}
                disabled={
                  !condition ||
                  (condition === 'damaged' &&
                    (!getSelectedDamageFee() || (getSelectedDamageFee() || 0) > maxAllowableDamageFee))
                }
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Confirm & Settle Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Return Modal */}
      {rejectingBooking && (
        <Modal
          isOpen={!!rejectingBooking}
          onClose={handleCloseRejectModal}
          title={`Reject Return Request — #${rejectingBooking.id}`}
          description="Revert the booking status to Active and communicate the rejection reason."
          maxWidth="md"
        >
          <form onSubmit={handleSubmitReject} className="space-y-4">
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Rejecting will revert Booking #{rejectingBooking.id} back to Active status so the user can resubmit with the correct item.
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Wrong accessory returned, mismatched serial number, or item brought without power adapter..."
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
                Reject Return Request
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Authoritative Fine Success Settlement Modal */}
      {completedReturnData && (
        <Modal
          isOpen={!!completedReturnData}
          onClose={() => setCompletedReturnData(null)}
          title="Return Finalized Successfully"
          description="Stock has been updated and fines recorded in the database."
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Return Settled for Booking #{completedReturnData.booking.id}
              </div>

              <div className="space-y-1.5 text-slate-700 pt-1 border-t border-emerald-200/60">
                <div className="flex justify-between">
                  <span>Verified Condition:</span>
                  <span className="font-semibold capitalize text-slate-900">
                    {completedReturnData.booking.returnCondition}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Returned At:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateTime(completedReturnData.booking.returnedAt || undefined)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stock Restored:</span>
                  <span className="font-semibold text-slate-900">
                    {completedReturnData.booking.returnCondition === 'lost'
                      ? 'No (Lost Item)'
                      : `Yes (+${completedReturnData.booking.quantity} units)`}
                  </span>
                </div>
              </div>

              {/* Fine Summary if fine created */}
              {completedReturnData.fine ? (
                <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-300 space-y-1.5">
                  <p className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>Assessed Fine Total:</span>
                    <span className="text-rose-600 font-extrabold text-sm">
                      {formatCurrency(completedReturnData.fine.totalFine)}
                    </span>
                  </p>
                  <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Late Fee ({completedReturnData.fine.daysLate}d late):</span>
                      <span>{formatCurrency(completedReturnData.fine.breakdown.lateFee)}</span>
                    </div>
                    {completedReturnData.fine.breakdown.damageFee > 0 && (
                      <div className="flex justify-between">
                        <span>Damage Fee:</span>
                        <span>{formatCurrency(completedReturnData.fine.breakdown.damageFee)}</span>
                      </div>
                    )}
                    {completedReturnData.fine.breakdown.replacementCost > 0 && (
                      <div className="flex justify-between">
                        <span>Replacement Cost:</span>
                        <span>{formatCurrency(completedReturnData.fine.breakdown.replacementCost)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  Zero fines assessed. Booking closed cleanly!
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCompletedReturnData(null)}
                className="bg-[#1E3A5F] hover:bg-[#152843]"
              >
                Close & Return to Queue
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
