import { useApi } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { UserLogin, UserSignup } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";


export const useUserSignup = () => {
  const api = useApi();

  return useMutation({
    mutationFn: async (userSignup: UserSignup) => {
      await api.auth.signup(userSignup);

      await api.auth.login({
        username: userSignup.username,
        password: userSignup.password,
      });

      return userSignup;
    },
    onSuccess: () => {
      toast.success("Account created and logged in successfully!");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const message = error.data?.detail || error.statusText || "Failed to create account";
        toast.error(message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
  })
}

export const useUserLogin = () => {
  const api = useApi();

  return useMutation({
    mutationFn: (userLogin: UserLogin) => api.auth.login(userLogin),
    onSuccess: () => {
      toast.success("Logged in successfully!");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const message = error.data?.detail || error.statusText || "Failed to log in";
        toast.error(message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
  })
}