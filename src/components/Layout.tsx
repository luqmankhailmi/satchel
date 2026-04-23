import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useEffect } from "react";
import { useStore } from "../store/useStore";

export default function Layout() {
  const { theme } = useStore();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--text)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
