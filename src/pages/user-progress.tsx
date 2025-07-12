import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import UserProgressDashboard from '@/components/progress/UserProgressDashboard';
import AuthGuard from '@/components/auth/AuthGuard';

export default function UserProgressPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <UserProgressDashboard />
      </div>
    </AuthGuard>
  );
}