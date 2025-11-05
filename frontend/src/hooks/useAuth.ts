import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { tokenStorage, useApi } from "@/lib/api";

export function useAuth() {
  const api = useApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(tokenStorage.exists());

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(tokenStorage.exists());
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const logout = (returnTo?: string) => {
    api.auth.logout();

    queryClient.clear();

    const destination = returnTo || "/";

    setTimeout(() => {
      navigate(destination, { replace: true });
    }, 0);
  };

  return {
    isAuthenticated,
    logout,
  };
}

export function useAuthRedirect(
  redirectTo: string,
  shouldRedirect: (isAuth: boolean) => boolean,
  saveReturnPath = false
) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(tokenStorage.exists());

  useEffect(() => {
    const checkAuth = () => {
      const currentAuthState = tokenStorage.exists();
      setIsAuthenticated(currentAuthState);

      if (shouldRedirect(currentAuthState)) {
        if (saveReturnPath && redirectTo === "/login") {
          const currentPath = window.location.pathname + window.location.search;
          navigate(redirectTo, { replace: true, state: { from: currentPath } });
        } else {
          navigate(redirectTo, { replace: true });
        }
      }
    };

    checkAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        checkAuth();
      }
    };

    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [navigate, redirectTo, shouldRedirect, saveReturnPath]);

  return isAuthenticated;
}

export function usePublicRoute() {
  return useAuthRedirect("/", (isAuth) => isAuth);
}

export function useProtectedRoute() {
  return useAuthRedirect("/login", (isAuth) => !isAuth, true);
}
