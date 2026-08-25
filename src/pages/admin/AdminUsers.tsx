import React, { useState, useEffect, useMemo } from 'react';
import { userApi } from '../../api/user.api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../utils/formatters';
import type { User, Role } from '../../types/api.types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { user: currentAuthUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [isCreating, setIsCreating] = useState(false);

  // Role Toggle State
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);

  // Delete State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const list = await userApi.getAll();
      setUsers(list);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toString().includes(q)
      );
    });
  }, [users, searchQuery]);

  const validateForm = () => {
    const errs: typeof formErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Valid email is required';
    }
    if (!formData.password || formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const created = await userApi.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setUsers((prev) => [created, ...prev]);
      showToast(`User ${created.name} created successfully`, 'success');
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', password: '' });
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleRole = async (targetUser: User) => {
    const newRole: Role = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';

    // Prevent removing own admin privileges
    if (targetUser.id === currentAuthUser?.id && newRole === 'USER') {
      showToast('You cannot demote your own administrator account', 'warning');
      return;
    }

    setUpdatingRoleId(targetUser.id);
    try {
      const updated = await userApi.updateRole(targetUser.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: updated.role } : u))
      );
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    if (deletingUser.id === currentAuthUser?.id) {
      showToast('You cannot delete your own logged-in account', 'warning');
      setDeletingUser(null);
      return;
    }

    setIsDeleting(true);
    try {
      await userApi.delete(deletingUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      showToast(`User ${deletingUser.name} removed successfully`, 'success');
      setDeletingUser(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="brand" size="sm">
              <Users className="w-3 h-3 mr-1" /> Team Management
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            User Accounts & Roles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage company team accounts, grant administrative privileges, and review registration logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormData({ name: '', email: '', password: '' });
              setFormErrors({});
              setIsAddModalOpen(true);
            }}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Create User
          </Button>
        </div>
      </div>

      {/* Users Table Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium self-end sm:self-center">
            {filteredUsers.length} active team members
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6 text-slate-400" />}
              title="No Users Found"
              description={
                searchQuery ? 'No accounts matched your search keyword.' : 'No users in the database.'
              }
              actionLabel={searchQuery ? 'Clear Search' : undefined}
              onAction={() => setSearchQuery('')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">User ID</th>
                    <th className="px-5 py-3.5">Full Name</th>
                    <th className="px-5 py-3.5">Email Address</th>
                    <th className="px-5 py-3.5">Access Role</th>
                    <th className="px-5 py-3.5">Joined Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((targetUser) => {
                    const isSelf = targetUser.id === currentAuthUser?.id;
                    const isAdminUser = targetUser.role === 'ADMIN';

                    return (
                      <tr key={targetUser.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-500">
                          #{targetUser.id}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center text-[11px] font-bold">
                            {targetUser.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{targetUser.name}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-blue-50 text-[#1E3A5F] px-1.5 py-0.2 rounded font-semibold border border-blue-200">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono">
                          {targetUser.email}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggleRole(targetUser)}
                            disabled={updatingRoleId === targetUser.id || isSelf}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                              isAdminUser
                                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            } disabled:opacity-75 disabled:cursor-not-allowed`}
                            title={isSelf ? 'Cannot modify own role' : 'Click to toggle role'}
                          >
                            {isAdminUser ? (
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                            ) : (
                              <UserCheck className="w-3 h-3 text-slate-500" />
                            )}
                            <span>{targetUser.role}</span>
                            {updatingRoleId === targetUser.id && (
                              <span className="animate-spin text-[10px]">&bull;</span>
                            )}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {formatDate(targetUser.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => setDeletingUser(targetUser)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30"
                            aria-label="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Create User Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create Team Account"
          description="Provision a new team member with direct system access"
          maxWidth="md"
        >
          <form onSubmit={handleCreateUser} className="space-y-4 text-left">
            <Input
              label="Full Name"
              placeholder="Alex Johnson"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              autoFocus
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="alex@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
            />

            <Input
              label="Initial Password (min 8 characters)"
              isPassword
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
            />

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isCreating}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Provision User
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Confirmation */}
      {deletingUser && (
        <ConfirmDialog
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteUser}
          title="Delete User Account"
          message={`Are you sure you want to soft-delete account "${deletingUser.name}" (${deletingUser.email})? This user will no longer be able to log in.`}
          confirmText="Yes, Delete User"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
