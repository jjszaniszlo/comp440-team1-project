import { Route, Routes } from "react-router";
import { ThemeProvider } from "./components/theme-provider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { Login, Signup } from "./pages/Auth";
import { Home } from "./pages/Home";
import { Toaster } from "@/components/ui/sonner";
import { BlogHomePage, ViewBlogPage } from "./pages/Blog";
import { MainLayout } from "./layout/MainLayout";
import { EditBlogPage } from "./pages/Blog/EditBlogPage";
import { UserPage } from "./pages/User";
import { ProfilePage, FollowersPage, FollowingPage } from "./pages/Profile";

export function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/" element={<BlogHomePage />} />
          <Route path="/blog/:blogId" element={<ViewBlogPage />} />
          <Route path="/user-queries" element={<UserPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile/:username/followers" element={<FollowersPage />} />
          <Route path="/profile/:username/following" element={<FollowingPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/user" element={<Home />} />
            <Route path="/blog/:blogId/edit" element={<EditBlogPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}
