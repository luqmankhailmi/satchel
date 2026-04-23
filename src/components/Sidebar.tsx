import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Grid3X3, CheckSquare, FileText,
  FolderKanban, BookOpen, Archive, Link2, Search, GraduationCap,
  Settings,
} from "lucide-react";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/timetable", icon: Grid3X3, label: "Timetable" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/notes", icon: FileText, label: "Notes" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/courses", icon: BookOpen, label: "Courses" },
  { to: "/exams", icon: Archive, label: "Exam Papers" },
  { to: "/resources", icon: Link2, label: "Resources" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-56 shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--border-2)] flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 py-5 cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
          <GraduationCap size={16} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-[var(--text-strong)]">Satchel</span>
          <p className="text-[10px] text-[var(--text-muted)] -mt-0.5">Your Academic Workbench</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto">
        <p className="text-[10px] text-[var(--text-faint)] font-semibold uppercase tracking-wider px-3 pb-2 pt-1">Menu</p>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5 ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-600/30"
                  : "text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-3)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? "text-indigo-400" : ""} />
                <span className="font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--border-2)]">
        <p className="text-[10px] text-[var(--text-faint)]">Data stored locally</p>
      </div>
    </aside>
  );
}
