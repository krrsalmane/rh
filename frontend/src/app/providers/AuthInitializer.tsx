import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials, clearCredentials } from '@/store/authSlice';
import { authApi } from '@/features/auth/api';
import { Loader2 } from 'lucide-react';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { accessToken, user } = await authApi.refresh();
        dispatch(setCredentials({
          user,
          accessToken,
          role: user.role,
          companyId: user.companyId,
        }));
      } catch (error) {
        dispatch(clearCredentials());
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, [dispatch]);

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center gap-6 mb-8">
          <img 
            src="/assets/images/mayagroup-logo.png" 
            alt="Maya Group" 
            className="h-24 object-contain"
          />
        </div>
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Chargement...</p>
      </div>
    );
  }

  return <>{children}</>;
}
