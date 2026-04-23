import { useMemo } from "react";
import { useStore } from "../store/useStore";
import { Monitor, Moon, Sun } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useStore();

  const items = useMemo(
    () => [
      { id: "dark" as const, label: "Dark", icon: Moon, desc: "Best for late-night study sessions." },
      { id: "light" as const, label: "Light", icon: Sun, desc: "Bright and clean for daytime work." },
    ],
    []
  );

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-600/25 flex items-center justify-center">
          <Monitor size={18} className="text-indigo-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-strong)]">Settings</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Personalize Satchel to fit your vibe.</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--text-strong)] mb-3">Theme</h2>
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => {
            const Icon = it.icon;
            const active = theme === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setTheme(it.id)}
                className={`text-left rounded-xl p-4 border transition-colors ${
                  active
                    ? "bg-indigo-600/10 border-indigo-600/30"
                    : "bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--surface-3)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className={active ? "text-indigo-500" : "text-[var(--text-muted)]"} />
                  <span className="text-sm font-semibold text-[var(--text-strong)]">{it.label}</span>
                  {active && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white">Active</span>}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">{it.desc}</p>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[var(--text-faint)] mt-3">
          Theme is stored locally on this device.
        </p>
      </div>
    </div>
  );
}
