import { Outlet } from 'react-router';
import { useProtectedRoute } from '@/hooks/useAuth';

export function ProtectedRoute() {
  useProtectedRoute();

  return <Outlet />;
}
