import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { QueryProvider } from './QueryProvider';
import { AuthInitializer } from './AuthInitializer';
import { Toaster } from 'react-hot-toast';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <QueryProvider>
        <AuthInitializer>
          {children}
        </AuthInitializer>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#0ea5e9', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </QueryProvider>
    </Provider>
  );
}
