import { useApi, getErrorMessage } from "@/lib/api";
import type { UserLogin, UserSignup } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export const useUserSignup = () => {
  const api = useApi();
  const queryClient = useQueryClient();

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
      queryClient.clear();
      toast.success("Account created and logged in successfully!");
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to create account");
      toast.error(message);
    },
  })
}

export const useUserLogin = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userLogin: UserLogin) => api.auth.login(userLogin),
    onSuccess: () => {
      queryClient.clear();
      toast.success("Logged in successfully!");
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to log in");
      toast.error(message);
    },
  })
}