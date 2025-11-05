import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { useLogin } from "./hooks";

export function Login() {
  const navigate = useNavigate();
  const { form, updateField, handleSubmit, errors, isValid, isPending } = useLogin();

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
                    value={form.username}
                    onChange={(e) => updateField("username", e.target.value)}
                    disabled={isPending}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    disabled={isPending}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>

            <Button
              type="submit"
              disabled={!isValid || isPending}
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
