import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUserSignup } from "@/hooks/mutations/auth";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router";

export function Signup() {
  // use this to navigate back to the login page.  Redirects everywhere else
  // are automatically handled, like after signing in for example.
  // example: navigate("/login");
  const navigate = useNavigate();
  const { mutate: signup } = useUserSignup();

  // use the setSignUpInfo function to update the form state
  // in each component's onChange handler
  // e.g. onChange={e => setSignUpInfo({...signUpInfo, username: e.target.value})}
  const [signUpInfo, setSignUpInfo] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
  })

  // use this to validate if passwords match
  // put a FieldError component next to the password input on this condition
  const usernameError = useMemo(() => {
    if (!signUpInfo.username) return null;
    const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{5,29}$/;
    if (!usernameRegex.test(signUpInfo.username)) {
      return "Username must start with a letter, be 6-30 characters, and contain only letters, numbers, or underscores";
    }
    return null;
  }, [signUpInfo.username])

  // use this to validate if passwords match
  // put a FieldError component next to the password input on this condition
  const passwordError = useMemo(() => {
    if (!signUpInfo.confirmPassword) return null;
    return signUpInfo.password !== signUpInfo.confirmPassword ? "Passwords do not match" : null;
  }, [signUpInfo.password, signUpInfo.confirmPassword])

  // use this to validate email format
  // put a FieldError component next to the email input on this condition
  const emailError = useMemo(() => {
    if (!signUpInfo.email) return null;
    const emailRegex = /^\S+@\S+\.\S+$/;
    return !emailRegex.test(signUpInfo.email) ? "Invalid email format" : null;
  }, [signUpInfo.email])

  // use this to validate phone number format
  // put a FieldError component next to the phone input on this condition
  const phoneError = useMemo(() => {
    if (!signUpInfo.phone) return null;
    const phoneRegex = /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
    return !phoneRegex.test(signUpInfo.phone) ? "Invalid phone number format" : null;
  }, [signUpInfo.phone])

  // use this to check if the form can be submitted
  // e.g. enable/disable the submit button
  const isSignUpInfoValid = useMemo(() => {
    const requiredFields = [
      signUpInfo.username,
      signUpInfo.password,
      signUpInfo.confirmPassword,
      signUpInfo.email,
      signUpInfo.phone,
      signUpInfo.first_name,
      signUpInfo.last_name,
    ];

    return requiredFields.every(field => field.trim() !== '') &&
      !usernameError &&
      !passwordError &&
      !emailError &&
      !phoneError;
  }, [signUpInfo, usernameError, passwordError, emailError, phoneError])

  // Use this to handle the actual signup logic
  // this is called by handleSubmit, so you should not need to call this directly
  const handleSignup = () => {
    if (isSignUpInfoValid) {
      signup({
        username: signUpInfo.username,
        password: signUpInfo.password,
        email: signUpInfo.email,
        phone: signUpInfo.phone,
        first_name: signUpInfo.first_name,
        last_name: signUpInfo.last_name,
      });
    }
  }

  // Use this to handle form submission
  // put this on a form element's onSubmit handler
  // e.g. <form onSubmit={handleSubmit}>
  // this is called by the form's onSubmit, so you should not need to call this directly
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSignup();
  }

  // Checkout src/components/ui for different components that I added.
  // They are all shadcn components and u can see the docs for them here:
  // https://ui.shadcn.com/docs/components
  return (
    <div className="justify-center items-center min-h-screen p-20">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="flex items-center justify-between">
          <h2 className="">Sign Up</h2>
          <ThemeModeToggle />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
        </CardContent>
      </Card>
    </div>
  );
}