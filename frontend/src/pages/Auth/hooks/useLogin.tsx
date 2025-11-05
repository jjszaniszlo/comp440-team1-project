import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useUserLogin } from "@/hooks/mutations";

interface LoginForm {
  username: string;
  password: string;
}

const validateUsername = (username: string): string | null => {
  if (!username) return null;
  const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{5,29}$/;
  if (!usernameRegex.test(username)) {
    return "Username must start with a letter, be 6-30 characters, and contain only letters, numbers, or underscores";
  }
  return null;
};

export function useLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate: login, isPending } = useUserLogin();

  const returnTo = searchParams.get("returnTo") || "/";

  const [form, setForm] = useState<LoginForm>({
    username: "",
    password: "",
  });

  const usernameError = validateUsername(form.username);

  const isValid =
    form.username.trim() !== "" &&
    form.password.trim() !== "" &&
    !usernameError;

  const updateField = <K extends keyof LoginForm>(field: K, value: LoginForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      login(form, {
        onSuccess: () => {
          setTimeout(() => {
            navigate(returnTo, { replace: true });
          }, 0);
        },
      });
    }
  };

  return {
    form,
    updateField,
    handleSubmit,
    errors: {
      username: usernameError,
    },
    isValid,
    isPending,
  };
}
