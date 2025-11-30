import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserMe } from "@/hooks/queries";
import { useCreateBlog } from "@/hooks/mutations";
import { useNavigate } from "react-router";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { CirclePlus } from "lucide-react";

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { data: user } = useUserMe();
  const { mutate: createBlog, isPending } = useCreateBlog();

  const handleCreateBlog = () => {
    createBlog(undefined, {
      onSuccess: (blog) => {
        navigate(`/blog/${blog.id}/edit`);
      },
    });
  };

  const getLoginLink = () => {
    const currentPath = location.pathname + location.search;
    if (currentPath === "/") return "/login";
    return `/login?returnTo=${encodeURIComponent(currentPath)}`;
  };

  const getSignupLink = () => {
    const currentPath = location.pathname + location.search;
    if (currentPath === "/") return "/signup";
    return `/signup?returnTo=${encodeURIComponent(currentPath)}`;
  };

  const protectedRoutes = ["/user", "/blog/"];

  const handleLogout = () => {
    const currentPath = location.pathname;

    const isProtectedRoute = protectedRoutes.some((route) => {
      if (route === "/blog/") {
        return currentPath.match(/^\/blog\/\d+\/edit$/);
      }
      return currentPath.startsWith(route);
    });

    if (isProtectedRoute) {
      logout("/");
    } else {
      logout(currentPath + location.search);
    }
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
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/user-queries" className="text-sm font-medium transition-colors hover:text-primary px-3">
                  Users
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          <ThemeModeToggle />
          {!isAuthenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link to={getLoginLink()}>Log In</Link>
              </Button>
              <Button asChild>
                <Link to={getSignupLink()}>Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                onClick={handleCreateBlog}
                disabled={isPending}
              >
                <CirclePlus className="h-5 w-5 mr-1" />
                {isPending ? "Creating..." : "Create Blog"}
              </Button>
              <Button variant="ghost" asChild>
                <Link to={`/profile/${user?.username}`} className="text-sm font-medium">
                  @{user?.username || "User"}
                </Link>
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Log Out
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
