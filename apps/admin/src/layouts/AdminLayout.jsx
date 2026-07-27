import { Outlet } from "react-router";

import { useSidebar } from "../hooks/useSidebar.js";
import AppHeader from "./AppHeader.jsx";
import AppSidebar from "./AppSidebar.jsx";
import Backdrop from "./Backdrop.jsx";

function AdminLayout() {
  const { isExpanded, isHovered } = useSidebar();

  const sidebarIsWide = isExpanded || isHovered;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 xl:flex">
      <AppSidebar />
      <Backdrop />

      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ease-in-out ${
          sidebarIsWide ? "lg:ml-72.5" : "lg:ml-22.5"
        }`}
      >
        <AppHeader />

        <main className="flex-1">
          <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
