import { URL } from '../../routes/url-constant';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { equipmentApi } from '../../api/equipment.api';
import { bookingApi } from '../../api/booking.api';
import { userApi } from '../../api/user.api';
import { formatCurrency, formatDate, getBookingStatus } from '../../utils/formatters';
import type { EquipmentItem, RentalBookingItem, User } from '../../types/api.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/molecules/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { Skeleton } from '../../components/atoms/Skeleton';
import {
  Boxes,
  CalendarCheck,
  Users,
  Shield,
  PlusCircle,
  ArrowRight,
  Package,
  RotateCcw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [bookings, setBookings] = useState<RentalBookingItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [eqList, bList, uList] = await Promise.all([
          equipmentApi.getAll().catch(() => []),
          bookingApi.getAll().catch(() => []),
          userApi.getAll().catch(() => []),
        ]);
        setEquipments(eqList);
        setBookings(bList);
        setUsers(uList);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalStockUnits = equipments.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const activeRentalsCount = bookings.filter(
    (b) => getBookingStatus(b.rentFrom, b.rentTo, b.status) === 'ACTIVE'
  ).length;
  const upcomingRentalsCount = bookings.filter(
    (b) => getBookingStatus(b.rentFrom, b.rentTo, b.status) === 'UPCOMING'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="brand" size="sm">
              <Shield className="w-3 h-3 mr-1" /> Operations Console
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            Fleet Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live overview of equipment inventory, current active rentals, and registered team members
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={URL.ADMIN_RETURNS}>
            <Button variant="outline" size="sm" className="border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 text-amber-900" leftIcon={<RotateCcw className="w-4 h-4 text-amber-700" />}>
              Return Requests
            </Button>
          </Link>
          <Link to={URL.ADMIN_EQUIPMENT}>
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Manage Equipment
            </Button>
          </Link>
          <Link to={URL.ADMIN_BOOKINGS}>
            <Button variant="outline" size="sm" leftIcon={<CalendarCheck className="w-4 h-4" />}>
              View All Bookings
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Equipment Models */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Equipment Models
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="w-20 h-8 mt-2" />
            ) : (
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                  {equipments.length}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Across all verified hardware categories
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 2: Available Units */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Available Units
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="w-20 h-8 mt-2" />
            ) : (
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                  {totalStockUnits}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ready for immediate deployment
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 3: Active Rentals */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active / Upcoming Bookings
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="w-20 h-8 mt-2" />
            ) : (
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                  {activeRentalsCount + upcomingRentalsCount}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {activeRentalsCount} active &bull; {upcomingRentalsCount} upcoming
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 4: Registered Users */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Team Accounts
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="w-20 h-8 mt-2" />
            ) : (
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                  {users.length}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {users.filter((u) => u.role === 'ADMIN').length} administrators
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two Column Section: Recent Bookings & Fleet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Bookings Table (7 cols) */}
        <Card className="lg:col-span-7 border-slate-200">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#1E3A5F]" /> Recent Reservations
            </CardTitle>
            <Link
              to={URL.ADMIN_BOOKINGS}
              className="text-xs font-semibold text-[#1E3A5F] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-8" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No bookings recorded in the system yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Equipment</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.slice(0, 5).map((booking) => {
                      const status = getBookingStatus(booking.rentFrom, booking.rentTo, booking.status);
                      return (
                        <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-600">
                            #{booking.id}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {booking.equipment?.name || `ID #${booking.equipmentId}`}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {booking.user?.name || `User #${booking.userId}`}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {formatDate(booking.rentFrom)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                status === 'ACTIVE'
                                  ? 'success'
                                  : status === 'UPCOMING'
                                  ? 'warning'
                                  : status === 'OVERDUE'
                                  ? 'danger'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fleet Stock Status (5 cols) */}
        <Card className="lg:col-span-5 border-slate-200">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#1E3A5F]" /> Fleet Inventory Preview
            </CardTitle>
            <Link
              to={URL.ADMIN_EQUIPMENT}
              className="text-xs font-semibold text-[#1E3A5F] hover:underline flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-8" />
              </div>
            ) : equipments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No equipment added yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {equipments.slice(0, 5).map((item) => (
                  <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{formatCurrency(item.price)} / day</p>
                    </div>
                    <Badge variant={item.quantity > 0 ? 'success' : 'danger'} size="sm">
                      {item.quantity} in stock
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
