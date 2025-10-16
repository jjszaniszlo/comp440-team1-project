import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUserLogin } from "@/hooks/mutations/auth";
import { useMemo, useState } from "react";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";


export function Login() {
  // use this to navigate to the sign up page. Redirects everywhere else automatically,
  // like after signing in for example.
  const navigate = useNavigate();
  const { mutate: login, isPending } = useUserLogin();
  
  // use the setLoginInfo function to update the form state
  // in each component's onChange handler
  // e.g. onChange={e => setLoginInfo({...loginInfo, username: e.target.value})}
  const [loginInfo, setLoginInfo] = useState({
    username: '',
    password: '',
  })

  // use this to validate the username format
  // put a FieldError component next to the username input on this condition
  const usernameError = useMemo(() => {
    if (!loginInfo.username) return null;
    const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{5,29}$/;
    if (!usernameRegex.test(loginInfo.username)) {
      return "Username must start with a letter, be 6-30 characters, and contain only letters, numbers, or underscores";
    }
    return null;
  }, [loginInfo.username])

  // use this to determine if the form can be submitted
  // e.g. disable the submit button if this is false
  const canSubmit = useMemo(() => {
    return loginInfo.username.trim() !== '' && loginInfo.password.trim() !== '' && !usernameError;
  }, [loginInfo, usernameError]);

  // Use this to handle the actual login logic
  // put this on a form element's onSubmit handler
  // e.g. <form onSubmit={handleSubmit}>
  // this is called by the form's onSubmit, so you should not need to call this directly
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameError && loginInfo.username && loginInfo.password) {
      login(loginInfo);
    }
  }

  // Checkout src/components/ui for different components that I added.
  // They are all shadcn components and u can see the docs for them here:
  // https://ui.shadcn.com/docs/components
  return (
    <div className="justify-center items-center min-h-screen p-20">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          Login
          <ThemeModeToggle />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>Username</FieldLabel>
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    value={loginInfo.username}
                    onChange={e => setLoginInfo({...loginInfo, username: e.target.value})}
                    disabled={isPending}
                  />
                  {usernameError && (
                    <p className="text-sm text-red-500 mt-1">{usernameError}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={loginInfo.password}
                    onChange={e => setLoginInfo({...loginInfo, password: e.target.value})}
                    disabled={isPending}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>

            <Button 
              type="submit" 
              disabled={!canSubmit || isPending}
              className="w-full"
            >
              {isPending ? 'Logging in...' : 'Login'}
            </Button>

            <div className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => navigate('/signup')}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}