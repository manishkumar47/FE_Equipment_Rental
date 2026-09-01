import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fineApi } from '../api/fine.api';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { getEquipmentIcon } from '../utils/categoryIcons';
import type { MyFineEntry } from '../types/api.types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Receipt,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Clock,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

const REASON_LABEL: Record<string, string> = {
  late: 'Late return fee',
  damaged: 'Damage fee',
  lost: 'Replacement cost',
};

function parseReason(reason: string | null): { label: string; amount: number }[] {
  if (!reason) return [];
  return reason
    .split(',')
    .map((part) => {
      const [type, amount] = part.split(':');
      return { label: REASON_LABEL[type] || type, amount: Number(amount) || 0 };
    })
    .filter((r) => r.amount > 0);
}

function daysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const diffMs = new Date(dateString).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export const MyFines: React.FC = () => {
  const { showToast } = useToast();
  const [fines, setFines] = useState<MyFineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payingFine, setPayingFine] = useState<MyFineEntry | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const fetchFines = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fineApi.getMyFines();
      setFines(items);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const handlePay = async () => {
    if (!payingFine) return;
    setIsPaying(true);
    try {
      await fineApi.pay(payingFine.fine.id);
      showToast(`Fine #${payingFine.fine.id} marked as paid.`, 'success');
      setFines((prev) =>
        prev.map((f) =>
          f.fine.id === payingFine.fine.id ? { ...f, fine: { ...f.fine, status: 'paid' } } : f
        )
      );
      setPayingFine(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsPaying(false);
    }
  };

  const unpaidTotal = fines
    .filter((f) => f.fine.status === 'unpaid')
    .reduce((sum, f) => sum + f.fine.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="brand" size="sm">
              <Receipt className="w-3 h-3 mr-1" /> Account Charges
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            My Fines &amp; Charges
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Late fees, damage charges, and replacement costs from your rental history
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unpaidTotal > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Outstanding
              </p>
              <p className="text-lg font-bold text-rose-600">{formatCurrency(unpaidTotal)}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFines}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="w-48 h-5" />
                    <Skeleton className="w-36 h-4" />
                  </div>
                </div>
                <Skeleton className="w-24 h-8" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center max-w-md mx-auto my-8">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-rose-900 mb-1">Failed to Load Fines</h3>
          <p className="text-xs text-rose-600 mb-4">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchFines}>
            Retry
          </Button>
        </div>
      ) : fines.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-7 h-7 text-emerald-500" />}
          title="No Fines on Your Account"
          description="You have no late, damage, or replacement charges. Keep up the clean rental record!"
          actionLabel="Browse Equipment"
          onAction={() => window.location.assign('/equipment')}
        />
      ) : (
        <div className="space-y-4">
          {fines.map((entry) => {
            const { fine, booking, equipment } = entry;
            const breakdown = parseReason(fine.reason);
            const remainingDays = daysUntil(fine.dueDate);
            const isUnpaid = fine.status === 'unpaid';
            const isOverdue = isUnpaid && remainingDays !== null && remainingDays < 0;

            return (
              <Card key={fine.id} hoverEffect className="overflow-hidden border-slate-200/90">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-[#1E3A5F] flex items-center justify-center shrink-0">
                        {getEquipmentIcon(equipment.name)}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            Fine #{fine.id}
                          </span>
                          <h3 className="text-base font-bold text-slate-900">{equipment.name}</h3>

                          {fine.status === 'paid' ? (
                            <Badge variant="neutral" size="sm">
                              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> Paid
                            </Badge>
                          ) : fine.status === 'waived' ? (
                            <Badge variant="neutral" size="sm">
                              Waived
                            </Badge>
                          ) : isOverdue ? (
                            <Badge variant="danger" size="sm">
                              <AlertCircle className="w-3 h-3 mr-1" /> Overdue
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              <Clock className="w-3 h-3 mr-1" /> Unpaid
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-500">
                          From booking #{booking.id} &bull; {formatDate(booking.rentFrom)} &rarr;{' '}
                          {formatDate(booking.rentTo)}
                        </p>

                        {breakdown.length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                            {breakdown.map((b, i) => (
                              <span key={i}>
                                {b.label}: <span className="font-semibold">{formatCurrency(b.amount)}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {fine.dueDate && (
                          <p className="text-[11px] text-slate-400">
                            {isUnpaid
                              ? isOverdue
                                ? `Was due ${formatDate(fine.dueDate)} — please pay as soon as possible`
                                : `Due by ${formatDate(fine.dueDate)} (${remainingDays} day${remainingDays === 1 ? '' : 's'} left)`
                              : `Created ${formatDateTime(fine.createdAt)}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xl font-bold text-slate-900">
                        {formatCurrency(fine.amount)}
                      </span>
                      {isUnpaid && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setPayingFine(entry)}
                          leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                          className="bg-[#1E3A5F] hover:bg-[#152843]"
                        >
                          Pay Now
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

      {/* Pay Confirmation */}
      {payingFine && (
        <ConfirmDialog
          isOpen={!!payingFine}
          onClose={() => setPayingFine(null)}
          onConfirm={handlePay}
          title="Pay Fine"
          message={`Pay ${formatCurrency(payingFine.fine.amount)} for fine #${payingFine.fine.id} (${payingFine.equipment.name})? This is a placeholder payment — no real charge will be made yet.`}
          confirmText="Yes, Mark as Paid"
          variant="primary"
          isLoading={isPaying}
        />
      )}

      {fines.length > 0 && (
        <div className="text-center pt-2">
          <Link
            to="/rentals"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            View My Rentals <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
