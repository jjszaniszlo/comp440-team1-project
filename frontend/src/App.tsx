import { Route, Routes } from "react-router"
import { ThemeProvider } from "./components/theme-provider"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { PublicRoute } from "./components/PublicRoute"
import { Login } from "./pages/Login"
import { Signup } from "./pages/Signup"
import { Home } from "./pages/Home"
import { Toaster } from "@/components/ui/sonner"
import { BlogHomePage } from "./pages/Blog"
import { MainLayout } from "./layout/MainLayout"

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

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/user" element={<Home />} />
          </Route>
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </ThemeProvider>
  )
}