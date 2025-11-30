import { useApi } from "@/lib/api";
import type {
  UserPublicProfile,
  UserPrivateProfile,
  UserCommentResponse,
  FollowUserResponse,
} from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useUserProfile(username: string) {
  const api = useApi();

  return useQuery({
    queryKey: ["user-profile", username],
    queryFn: () => api.get<UserPublicProfile>(`/users/${username}`, false),
    enabled: !!username,
  });
}

export function useMyProfile() {
  const api = useApi();

  return useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.get<UserPrivateProfile>("/users/me"),
    enabled: api.auth.isAuthenticated(),
  });
}

export function useUserComments(username: string) {
  const api = useApi();

  return useQuery({
    queryKey: ["user-comments", username],
    queryFn: () => api.get<UserCommentResponse[]>(`/users/${username}/comments`, false),
    enabled: !!username,
  });
}

export function useUserFollowers(username: string) {
  const api = useApi();

  return useQuery({
    queryKey: ["user-followers", username],
    queryFn: () => api.get<FollowUserResponse[]>(`/follow/users/${username}/followers`, false),
    enabled: !!username,
  });
}

export function useUserFollowing(username: string) {
  const api = useApi();

  return useQuery({
    queryKey: ["user-following", username],
    queryFn: () => api.get<FollowUserResponse[]>(`/follow/users/${username}/following`, false),
    enabled: !!username,
  });
}

export function useIsFollowing(username: string) {
  const api = useApi();

  return useQuery({
    queryKey: ["is-following", username],
    queryFn: () => api.get<boolean>(`/follow/users/${username}/is-following`),
    enabled: !!username && api.auth.isAuthenticated(),
  });
}
