import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { equipmentApi } from '../api/equipment.api';
import { categoryApi } from '../api/category.api';
import { bookingApi } from '../api/booking.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import { formatCurrency, calculateRentalDays } from '../utils/formatters';
import { getEquipmentIcon } from '../utils/categoryIcons';
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel';
import type { EquipmentItem, Category, EquipmentSortBy } from '../types/api.types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  ArrowRight,
  PackageCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

const PAGE_SIZE = 24;

export const Equipment: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<EquipmentSortBy>('name_asc');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Quick Rent Modal State
  const [rentingItem, setRentingItem] = useState<EquipmentItem | null>(null);
  const [rentQuantity, setRentQuantity] = useState(1);
  const [rentFrom, setRentFrom] = useState('');
  const [rentTo, setRentTo] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState<{
    id: number;
    equipmentName: string;
    quantity: number;
    days: number;
    total: number;
    rentFrom: string;
    rentTo: string;
  } | null>(null);

  // Debounce free-text search before it drives a server request
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    categoryApi
      .getAll()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const fetchPage = async (pageToLoad: number, isReset: boolean) => {
    if (isReset) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const categoryId =
        selectedCategory !== 'ALL' && !isNaN(Number(selectedCategory))
          ? Number(selectedCategory)
          : undefined;

      const res = await equipmentApi.getPaginated({
        page: pageToLoad,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        categoryId,
        inStockOnly,
        sortBy,
      });

      setTotal(res.total);
      setPage(res.page);
      setHasMore(res.page < res.totalPages);
      setEquipments((prev) => (isReset ? res.data : [...prev, ...res.data]));
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Reset to page 1 and refetch whenever a filter/search/sort changes
  useEffect(() => {
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategory, sortBy, inStockOnly]);

  const sentinelRef = useInfiniteScrollSentinel(() => {
    fetchPage(page + 1, false);
  }, hasMore && !isLoading && !isLoadingMore);

  const filteredEquipments = equipments;

  // Handle Quick Rent Trigger
  const handleOpenRentModal = (item: EquipmentItem) => {
    if (!isAuthenticated) {
      showToast(t('SIGN_IN_TO_RENT_REQUIRED'), 'info');
      navigate('/login', { state: { from: { pathname: '/equipment' } } });
      return;
    }
    setRentingItem(item);
    setRentQuantity(1);

    // Default dates: tomorrow to day after tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);

    setRentFrom(tomorrow.toISOString().slice(0, 16));
    setRentTo(dayAfter.toISOString().slice(0, 16));
  };

  const handleConfirmRental = async () => {
    if (!rentingItem) return;

    if (!rentFrom || !rentTo) {
      showToast(t('RENTAL_DATES_REQUIRED'), 'error');
      return;
    }

    const startDate = new Date(rentFrom);
    const endDate = new Date(rentTo);

    if (endDate <= startDate) {
      showToast(t('RENTAL_END_DATE_AFTER_START_DATE_REQUIRED'), 'error');
      return;
    }

    if (startDate < new Date()) {
      showToast(t('RENTAL_START_DATE_FUTURE_REQUIRED'), 'error');
      return;
    }

    if (rentQuantity > rentingItem.quantity) {
      showToast(t('ONLY_N_UNITS_AVAILABLE', { count: rentingItem.quantity }), 'error');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const created = await bookingApi.create({
        equipmentId: rentingItem.id,
        quantity: rentQuantity,
        rentFrom: startDate.toISOString(),
        rentTo: endDate.toISOString(),
      });

      const days = calculateRentalDays(startDate, endDate);
      const total = days * rentingItem.price * rentQuantity;

      setBookingConfirmation({
        id: created.id,
        equipmentName: rentingItem.name,
        quantity: rentQuantity,
        days,
        total,
        rentFrom,
        rentTo,
      });

      // Update local equipment stock
      setEquipments((prev) =>
        prev.map((eq) =>
          eq.id === rentingItem.id
            ? { ...eq, quantity: Math.max(0, eq.quantity - rentQuantity) }
            : eq
        )
      );

      showToast(t('RENTAL_BOOKED_SUCCESSFULLY'), 'success');
      setRentingItem(null);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      showToast(msg, 'error');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="brand" size="sm">
              <Sparkles className="w-3 h-3 mr-1" /> Enterprise Inventory
            </Badge>
            <span className="text-xs text-slate-400 font-medium">
              {total} model{total === 1 ? '' : 's'} found
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            Equipment Catalog
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Rent high-performance workstations, audiovisual production gear, studio systems, and networking devices on flexible schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <Link to="/rentals">
              <Button variant="outline" size="md" leftIcon={<Clock className="w-4 h-4" />}>
                My Rentals
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by equipment name, model, specs (e.g. MacBook, Canon, Sony)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all"
            />
          </div>

          {/* Sort & Availability Controls */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="stock_desc">Highest Stock</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F]"
              />
              In Stock Only
            </label>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs border-t border-slate-100">
          <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Categories:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-md font-medium transition-colors shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-[#1E3A5F] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Hardware
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`px-3 py-1 rounded-md font-medium transition-colors shrink-0 ${
                selectedCategory === String(cat.id)
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="w-16 h-5" />
                </div>
                <Skeleton className="w-3/4 h-5" />
                <Skeleton className="w-full h-10" />
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Skeleton className="w-20 h-6" />
                  <Skeleton className="w-16 h-8" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center max-w-md mx-auto my-8">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-rose-900 mb-1">Failed to Load Equipment</h3>
          <p className="text-xs text-rose-600 mb-4">{error}</p>
          <Button variant="primary" size="sm" onClick={() => fetchPage(1, true)}>
            Retry Request
          </Button>
        </div>
      ) : filteredEquipments.length === 0 ? (
        <EmptyState
          icon={<PackageCheck className="w-6 h-6 text-slate-400" />}
          title="No Equipment Found"
          description={
            searchQuery || selectedCategory !== 'ALL' || inStockOnly
              ? 'No items matched your current filters. Try changing your search keywords or clearing filters.'
              : 'The equipment inventory is currently empty.'
          }
          actionLabel="Clear All Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('ALL');
            setInStockOnly(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredEquipments.map((item) => {
            const isAvailable = item.quantity > 0;

            return (
              <Card
                key={item.id}
                hoverEffect
                className="flex flex-col justify-between overflow-hidden group border-slate-200/90"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top row: Icon/Image and Stock badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 text-[#1E3A5F] flex items-center justify-center shrink-0 overflow-hidden group-hover:border-slate-300 transition-colors">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        getEquipmentIcon(item.name)
                      )}
                    </div>
                    <div className="text-right">
                      {isAvailable ? (
                        <Badge variant="success" size="sm">
                          {item.quantity} {item.quantity === 1 ? 'unit' : 'units'} left
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Title and specs */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-[#1E3A5F] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description || 'Enterprise-grade equipment calibrated for professional deployment.'}
                    </p>
                  </div>

                  {/* Pricing and Details link */}
                  <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                        Rental Rate
                      </span>
                      <span className="text-base font-bold text-slate-900">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal"> / day</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link to={`/equipment/${item.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs px-2.5">
                          Specs
                        </Button>
                      </Link>
                      <Button
                        variant={isAvailable ? 'primary' : 'secondary'}
                        size="sm"
                        disabled={!isAvailable}
                        onClick={() => handleOpenRentModal(item)}
                        className="text-xs font-semibold"
                      >
                        {isAvailable ? 'Rent' : 'Unavailable'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel + loading-more indicator */}
      {!isLoading && !error && (
        <div ref={sentinelRef} className="flex items-center justify-center py-4">
          {isLoadingMore && <Spinner size="sm" label="Loading more equipment..." />}
          {!hasMore && filteredEquipments.length > 0 && (
            <p className="text-xs text-slate-400 font-medium">
              You've reached the end — {total} model{total === 1 ? '' : 's'} total.
            </p>
          )}
        </div>
      )}

      {/* Quick Rent Modal */}
      {rentingItem && (
        <Modal
          isOpen={!!rentingItem}
          onClose={() => setRentingItem(null)}
          title={`Rent ${rentingItem.name}`}
          description="Configure your rental duration and quantity"
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            {/* Equipment summary pill */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center">
                  {getEquipmentIcon(rentingItem.name)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{rentingItem.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Daily Rate: {formatCurrency(rentingItem.price)} &bull; Available: {rentingItem.quantity} units
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                Quantity (Max {rentingItem.quantity})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={rentingItem.quantity}
                  value={rentQuantity}
                  onChange={(e) =>
                    setRentQuantity(
                      Math.max(1, Math.min(rentingItem.quantity, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
                <span className="text-xs text-slate-500">
                  {rentQuantity} &times; {formatCurrency(rentingItem.price)} = {formatCurrency(rentQuantity * rentingItem.price)} / day
                </span>
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Rent From
                </label>
                <input
                  type="datetime-local"
                  value={rentFrom}
                  onChange={(e) => setRentFrom(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Rent To
                </label>
                <input
                  type="datetime-local"
                  value={rentTo}
                  onChange={(e) => setRentTo(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                />
              </div>
            </div>

            {/* Calculated Order Summary */}
            {rentFrom && rentTo && (
              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Duration:</span>
                  <span className="font-semibold text-slate-800">
                    {calculateRentalDays(rentFrom, rentTo)} day(s)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Units:</span>
                  <span className="font-semibold text-slate-800">{rentQuantity} unit(s)</span>
                </div>
                <div className="flex items-center justify-between text-slate-900 font-bold border-t border-blue-200/60 pt-1.5 text-sm">
                  <span>Total Estimated Cost:</span>
                  <span className="text-[#1E3A5F]">
                    {formatCurrency(
                      calculateRentalDays(rentFrom, rentTo) * rentingItem.price * rentQuantity
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRentingItem(null)}
                disabled={isSubmittingBooking}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRental}
                isLoading={isSubmittingBooking}
                leftIcon={<PackageCheck className="w-4 h-4" />}
              >
                Confirm Reservation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Success Modal */}
      {bookingConfirmation && (
        <Modal
          isOpen={!!bookingConfirmation}
          onClose={() => setBookingConfirmation(null)}
          title="Rental Confirmed!"
          maxWidth="md"
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Booking Reference
              </p>
              <p className="text-xl font-mono font-bold text-slate-900">
                #{bookingConfirmation.id}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Equipment:</span>
                <span className="font-semibold text-slate-800">{bookingConfirmation.equipmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity Reserved:</span>
                <span className="font-semibold text-slate-800">{bookingConfirmation.quantity} unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rental Period:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(bookingConfirmation.rentFrom).toLocaleDateString()} &rarr; {new Date(bookingConfirmation.rentTo).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-sm">
                <span>Total Amount:</span>
                <span className="text-emerald-700">{formatCurrency(bookingConfirmation.total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-1/2"
                onClick={() => setBookingConfirmation(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-1/2"
                onClick={() => {
                  setBookingConfirmation(null);
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
