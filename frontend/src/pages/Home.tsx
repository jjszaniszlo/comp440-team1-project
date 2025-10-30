import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ThemeModeToggle } from "../components/theme-mode-toggle"
import { useUserMe } from "@/hooks/queries"
import { useApi } from "../lib/api"
import { useNavigate } from "react-router"

// feel free to change this page however you want.
export function Home() {
  const { data: user } = useUserMe();
  const api = useApi();
  const navigate = useNavigate();

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="w-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          User Info
          {user && <p className="text-sm text-muted-foreground">Logged in as {user.username}</p>}
          <ThemeModeToggle />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {user ? (
            <>
              <span>Name: {user.first_name} {user.last_name}</span>
              <span>Email: {user.email}</span>
              <span>Phone: {user.phone}</span>
              <Button onClick={handleLogout}>Log Out</Button>
            </>
          ) : (
            <span>You are not logged in!</span>
          )}
        </CardContent>
      </Card>
    </div>)
}