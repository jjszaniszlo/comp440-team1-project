import { Outlet } from "react-router";
import { NavBar } from "./components/NavBar";

export function MainLayout() {
  return (
    <>
      <NavBar />
      <Outlet />
      <div>
        <footer className="w-full py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} DB Team Project. All rights
          reserved.
        </footer>
      </div>
    </>
  );
}
