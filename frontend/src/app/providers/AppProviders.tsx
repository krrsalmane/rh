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
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            className: 'border border-slate-200 shadow-lg font-medium',
            style: {
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              style: {
                background: '#fff',
                border: '1px solid #fee2e2',
                color: '#991b1b',
              }
            },
          }}
        />
      </QueryProvider>
    </Provider>
  );
}
