import { useApi } from "@/lib/api";
import type { UserResponse } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export function useUserMe() {
  const api = useApi();

  return useQuery({
    queryKey: ["user-me"],
    queryFn: () => api.get<UserResponse>("/auth/me/"),
    enabled: api.auth.isAuthenticated(),
  });
}
