import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Boxes,
  CalendarCheck,
  User,
  LayoutDashboard,
  Shield,
  LogOut,
  Menu,
  X,
  Users,
  Layers,
  RotateCcw,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/equipment' && location.pathname.startsWith('/equipment')) return true;
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-md bg-[#1E3A5F] flex items-center justify-center text-white shadow-2xs group-hover:bg-[#152843] transition-colors">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  EquipFlow
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/equipment"
                className={`px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  isActive('/equipment')
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Equipment
              </Link>

              {isAuthenticated && (
                <Link
                  to="/rentals"
                  className={`px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    isActive('/rentals')
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
                  My Rentals
                </Link>
              )}

              {/* Admin specific top links */}
              {isAuthenticated && isAdmin && (
                <div className="flex items-center gap-1 pl-2 border-l border-slate-200 ml-1">
                  <Link
                    to="/admin/dashboard"
                    className={`px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/admin/dashboard')
                        ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/equipment"
                    className={`px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/admin/equipment')
                        ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    Fleet
                  </Link>
                  <Link
                    to="/admin/bookings"
                    className={`px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/admin/bookings')
                        ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    Bookings
                  </Link>
                  <Link
                    to="/admin/returns"
                    className={`px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/admin/returns')
                        ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    Returns
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/admin/users')
                        ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    Users
                  </Link>
                </div>
              )}
            </nav>
          </div>

          {/* Right Action / Auth Profile */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight truncate max-w-[130px]">
                      {user.email}
                    </p>
                  </div>
                  <Badge
                    variant={isAdmin ? 'brand' : 'neutral'}
                    size="sm"
                    className="ml-1"
                  >
                    {user.role}
                  </Badge>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          My Profile
                        </Link>
                        <Link
                          to="/rentals"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
                          Rental History
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5 text-[#1E3A5F]" />
                            Admin Console
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/equipment"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            Equipment Catalog
          </Link>
          {isAuthenticated && (
            <Link
              to="/rentals"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <CalendarCheck className="w-4 h-4 text-slate-500" />
              My Rentals
            </Link>
          )}

          {isAuthenticated && isAdmin && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="text-[11px] uppercase font-bold text-slate-400 px-3 tracking-wider">
                Admin Panel
              </p>
              <Link
                to="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <LayoutDashboard className="w-4 h-4 text-[#1E3A5F]" />
                Dashboard
              </Link>
              <Link
                to="/admin/equipment"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Boxes className="w-4 h-4 text-[#1E3A5F]" />
                Manage Equipment
              </Link>
              <Link
                to="/admin/bookings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <CalendarCheck className="w-4 h-4 text-[#1E3A5F]" />
                All Bookings
              </Link>
              <Link
                to="/admin/returns"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="w-4 h-4 text-[#1E3A5F]" />
                Return Requests
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Users className="w-4 h-4 text-[#1E3A5F]" />
                Users
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-1">
                  <div className="w-7 h-7 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
