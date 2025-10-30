import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUserLogin } from "@/hooks/mutations";
import { useMemo, useState } from "react";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate: login, isPending } = useUserLogin();

  const returnTo = searchParams.get("returnTo") || "/";

  const [loginInfo, setLoginInfo] = useState({
    username: "",
    password: "",
  });

  const usernameError = useMemo(() => {
    if (!loginInfo.username) return null;
    const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{5,29}$/;
    if (!usernameRegex.test(loginInfo.username)) {
      return "Username must start with a letter, be 6-30 characters, and contain only letters, numbers, or underscores";
    }
    return null;
  }, [loginInfo.username]);

  const canSubmit = useMemo(() => {
    return (
      loginInfo.username.trim() !== "" &&
      loginInfo.password.trim() !== "" &&
      !usernameError
    );
  }, [loginInfo, usernameError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameError && loginInfo.username && loginInfo.password) {
      login(loginInfo, {
        onSuccess: () => {
          setTimeout(() => {
            navigate(returnTo, { replace: true });
          }, 0);
        },
      });
    }
  };

  return (
    <div className="justify-center items-center min-h-screen p-20">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="flex items-center justify-between">
          <h2 className="">Login</h2>
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
                    onChange={(e) =>
                      setLoginInfo({ ...loginInfo, username: e.target.value })
                    }
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
                    onChange={(e) =>
                      setLoginInfo({ ...loginInfo, password: e.target.value })
                    }
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
              {isPending ? "Logging in..." : "Login"}
            </Button>

            <div className="text-sm text-center text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
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
