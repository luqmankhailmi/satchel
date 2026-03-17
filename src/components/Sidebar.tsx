import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Grid3X3, CheckSquare, FileText,
  FolderKanban, BookOpen, Archive, Link2, Search, GraduationCap,
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
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-56 shrink-0 bg-[#0d1020] border-r border-[#1a2035] flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 py-5 cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
          <GraduationCap size={16} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-slate-100">Satchel</span>
          <p className="text-[10px] text-slate-500 -mt-0.5">Your Academic Workbench</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto">
        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider px-3 pb-2 pt-1">Menu</p>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5 ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
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
      <div className="px-5 py-4 border-t border-[#1a2035]">
        <p className="text-[10px] text-slate-600">Data stored locally</p>
      </div>
    </aside>
  );
}
