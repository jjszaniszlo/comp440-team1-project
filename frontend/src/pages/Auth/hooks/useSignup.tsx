import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useUserSignup } from "@/hooks/mutations";

interface SignupForm {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
}

const validateUsername = (username: string): string | null => {
  if (!username) return null;
  const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{5,29}$/;
  if (!usernameRegex.test(username)) {
    return "Username must start with a letter, be 6-30 characters, and contain only letters, numbers, or underscores";
  }
  return null;
};

const validatePassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return null;
  return password !== confirmPassword ? "Passwords do not match" : null;
};

const validateEmail = (email: string): string | null => {
  if (!email) return null;
  const emailRegex = /^\S+@\S+\.\S+$/;
  return !emailRegex.test(email) ? "Invalid email format" : null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone) return null;
  const phoneRegex = /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
  return !phoneRegex.test(phone) ? "Invalid phone number format" : null;
};

export function useSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate: signup } = useUserSignup();

  const returnTo = searchParams.get("returnTo") || "/";

  const [form, setForm] = useState<SignupForm>({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone: "",
    first_name: "",
    last_name: "",
  });

  const usernameError = validateUsername(form.username);
  const passwordError = validatePassword(form.password, form.confirmPassword);
  const emailError = validateEmail(form.email);
  const phoneError = validatePhone(form.phone);

  const requiredFields = [
    form.username,
    form.password,
    form.confirmPassword,
    form.email,
    form.phone,
    form.first_name,
    form.last_name,
  ];

  const isValid =
    requiredFields.every((field) => field.trim() !== "") &&
    !usernameError &&
    !passwordError &&
    !emailError &&
    !phoneError;

  const updateField = <K extends keyof SignupForm>(field: K, value: SignupForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      signup(
        {
          username: form.username,
          password: form.password,
          email: form.email,
          phone: form.phone,
          first_name: form.first_name,
          last_name: form.last_name,
        },
        {
          onSuccess: () => {
            setTimeout(() => {
              navigate(returnTo, { replace: true });
            }, 0);
          },
        }
      );
    }
  };

  return {
    form,
    updateField,
    handleSubmit,
    errors: {
      username: usernameError,
      password: passwordError,
      email: emailError,
      phone: phoneError,
    },
    isValid,
  };
}
