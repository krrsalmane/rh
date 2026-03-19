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
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center z-[9999]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-gray-900 font-bold text-2xl tracking-tight">
            Maya <span className="text-sky-500">HR</span>
          </span>
        </div>
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Chargement...</p>
      </div>
    );
  }

  return <>{children}</>;
}
