import { Outlet } from 'react-router';
import { usePublicRoute } from '@/hooks/useAuth';

export function PublicRoute() {
  usePublicRoute();

  return <Outlet />;
}
