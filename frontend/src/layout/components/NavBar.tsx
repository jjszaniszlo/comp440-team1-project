import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useApi } from "@/lib/api";
import { useUserMe } from "@/hooks/queries/user";
import { useNavigate } from "react-router";

export function NavBar() {
  const api = useApi();
  const navigate = useNavigate();
  const isAuthenticated = api.auth.isAuthenticated();
  const { data: user } = useUserMe();

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
  };

  return (
    <div className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/" className="text-xl font-bold">
                  BlogApp
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              {/* Placeholder for avatar/username - you can replace this later */}
              <span className="text-sm font-medium">
                {user?.username || 'User'}
              </span>
              <Button variant="ghost" onClick={handleLogout}>
                Log Out
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}