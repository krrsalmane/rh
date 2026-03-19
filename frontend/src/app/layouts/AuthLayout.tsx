import { Outlet } from 'react-router-dom';

/**
 * Auth layout — transparent wrapper so each auth page (Login, ForgotPassword)
 * can define its own full-screen layout.
 */
export function AuthLayout() {
  return <Outlet />;
}
