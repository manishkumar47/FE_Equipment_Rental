import { URL } from '../routes/url-constant';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../api/user.api';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import { formatDate } from '../utils/formatters';
import type { User as UserType } from '../types/api.types';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Skeleton } from '../components/atoms/Skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '../components/molecules/Card';
import { EmptyState } from '../components/molecules/EmptyState';
import {
  User as UserIcon,
  Mail,
  Shield,
  ShieldCheck,
  CalendarCheck,
  Boxes,
  Lock,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { showToast } = useToast();
  const [profileData, setProfileData] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await userApi.getProfile();
        setProfileData(data);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        showToast(message, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex items-center gap-4 shadow-2xs">
          <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-56 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200">
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="w-full h-6" />
              <Skeleton className="w-full h-6" />
              <Skeleton className="w-full h-6" />
              <Skeleton className="w-full h-6" />
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="w-full h-20" />
              <Skeleton className="w-full h-8" />
              <Skeleton className="w-full h-8" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <EmptyState
        icon={<UserIcon className="w-10 h-10" />}
        title="Unable to load profile"
        description={error || 'Something went wrong while loading your profile.'}
      />
    );
  }

  const { name, email, role, createdAt, id } = profileData;
  const isAdmin = role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#1E3A5F] text-white flex items-center justify-center text-xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {name}
              </h1>
              <Badge variant={isAdmin ? 'brand' : 'neutral'} size="sm">
                {role}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={URL.FORGOT_PASSWORD}>
            <Button variant="outline" size="sm" leftIcon={<Lock className="w-3.5 h-3.5" />}>
              Reset Password
            </Button>
          </Link>
          {isAdmin && (
            <Link to={URL.ADMIN_DASHBOARD}>
              <Button variant="primary" size="sm" leftIcon={<Shield className="w-3.5 h-3.5" />}>
                Admin Console
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details Card */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#1E3A5F]" /> Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Account ID:</span>
              <span className="font-mono font-semibold text-slate-800">
                #{id}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-semibold text-slate-800">{name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Email Address:</span>
              <span className="font-semibold text-slate-800">{email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Access Level:</span>
              <span className="font-semibold text-slate-800">{role}</span>
            </div>
            
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Member Since:</span>
                <span className="font-semibold text-slate-800">{formatDate(createdAt)}</span>
              </div>
            
          </CardContent>
        </Card>

        {/* Security & Quick Actions */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Security & Platform Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <p className="font-semibold text-slate-800">Session Authentication</p>
              <p className="text-slate-500 leading-relaxed">
                Your account is protected by JWT bearer token encryption with role-based authorization verification on all endpoints.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link to={URL.RENTALS}>
                <Button variant="outline" size="sm" className="w-full justify-start" leftIcon={<CalendarCheck className="w-4 h-4" />}>
                  View My Equipment Rentals
                </Button>
              </Link>
              <Link to={URL.EQUIPMENT}>
                <Button variant="outline" size="sm" className="w-full justify-start" leftIcon={<Boxes className="w-4 h-4" />}>
                  Browse Fleet Catalog
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
