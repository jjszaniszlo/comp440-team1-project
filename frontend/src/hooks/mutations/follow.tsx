import { useApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useFollowUser() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) =>
      api.post(`/follow/users/${username}/follow`),
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({ queryKey: ["is-following", username] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", username] });
      queryClient.invalidateQueries({ queryKey: ["user-followers", username] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });
}

export function useUnfollowUser() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) =>
      api.delete(`/follow/users/${username}/follow`),
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({ queryKey: ["is-following", username] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", username] });
      queryClient.invalidateQueries({ queryKey: ["user-followers", username] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });
}
