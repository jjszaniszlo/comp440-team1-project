import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { tokenStorage } from '@/lib/api';

export function useAuthRedirect(redirectTo: string, shouldRedirect: (isAuth: boolean) => boolean) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(tokenStorage.exists());

  useEffect(() => {
    const checkAuth = () => {
      const currentAuthState = tokenStorage.exists();
      setIsAuthenticated(currentAuthState);

      if (shouldRedirect(currentAuthState)) {
        navigate(redirectTo, { replace: true });
      }
    };

    checkAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        checkAuth();
      }
    };

    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [navigate, redirectTo, shouldRedirect]);

  return isAuthenticated;
}

export function usePublicRoute() {
  return useAuthRedirect('/', (isAuth) => isAuth);
}

export function useProtectedRoute() {
  return useAuthRedirect('/login', (isAuth) => !isAuth);
}
