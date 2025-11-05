import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router";
import { useSignup } from "./hooks";

export function Signup() {
  const navigate = useNavigate();
  const { form, updateField, handleSubmit, errors, isValid } = useSignup();

  return (
    <div className="justify-center items-center min-h-screen p-20">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="flex items-center justify-between">
          <h2 className="">Sign Up</h2>
          <ThemeModeToggle />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>*Username</FieldLabel>
                  <Input
                    type="text"
                    placeholder="JohnDoe"
                    value={form.username}
                    onChange={(e) => updateField("username", e.target.value)}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                  )}
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>*Password</FieldLabel>
                    <Input
                      type="password"
                      placeholder="**********"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>*Confirm Password</FieldLabel>
                    <Input
                      type="password"
                      placeholder="*********"
                      value={form.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                    />
                  </Field>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>*First Name</FieldLabel>
                    <Input
                      type="text"
                      placeholder="John"
                      value={form.first_name}
                      onChange={(e) => updateField("first_name", e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>*Last Name</FieldLabel>
                    <Input
                      type="text"
                      placeholder="Doe"
                      value={form.last_name}
                      onChange={(e) => updateField("last_name", e.target.value)}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>*Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="johndoe@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel>*Phone Number</FieldLabel>
                  <Input
                    type="tel"
                    placeholder="+1 234 5678"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </Field>
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                )}
              </FieldGroup>
            </FieldSet>
            <Button
              type="submit"
              disabled={!isValid}
              className="w-full"
            >
              Sign Up
            </Button>
            <div className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary hover:underline font-medium"
              >
                Log in
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
