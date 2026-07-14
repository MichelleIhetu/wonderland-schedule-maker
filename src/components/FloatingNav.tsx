import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Target, ImageIcon, Sparkles, Clock, Home, Menu, X, Calendar } from "lucide-react";

type NavItem = {
  label: string;
  icon: typeof Home;
  onClick: (nav: ReturnType<typeof useNavigate>) => void;
  match: (pathname: string, state: any) => boolean;
};

const items: NavItem[] = [
  {
    label: "Home",
    icon: Home,
    onClick: (nav) => nav("/"),
    match: (p) => p === "/",
  },
  {
    label: "Calendar",
    icon: Calendar,
    onClick: (nav) => nav("/welcome-back", { state: { autoScan: true } }),
    match: (p) => p === "/welcome-back",
  },
  {
    label: "Schedule",
    icon: Clock,
    onClick: (nav) => nav("/", { state: { openScheduleView: true } }),
    match: () => false,
  },
  {
    label: "Goals",
    icon: Target,
    onClick: (nav) => nav("/goals"),
    match: (p) => p === "/goals",
  },
  {
    label: "Moodboard",
    icon: ImageIcon,
    onClick: (nav) => nav("/moodboard"),
    match: (p) => p === "/moodboard",
  },
  {
    label: "Vibe Check",
    icon: Sparkles,
    onClick: (nav) => nav("/vibe-check"),
    match: (p) => p === "/vibe-check",
  },
];

const HIDDEN_ROUTES = ["/auth"];

export default function FloatingNav() {
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const [open, setOpen] = useState(false);

  if (HIDDEN_ROUTES.includes(pathname)) return null;

  return (
    <div className="fixed top-4 left-4 z-[60] flex flex-col items-start gap-2 print:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        className="flex items-center justify-center w-11 h-11 rounded-full shadow-lg text-white transition-all hover:scale-105 active:scale-95"
        style={{ background: "hsl(280 55% 55%)" }}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <nav
          className="flex flex-col gap-1.5 p-2 rounded-2xl shadow-xl bg-white/95 backdrop-blur border"
          style={{ borderColor: "hsl(280 40% 80%)", minWidth: "11rem" }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname, state);
            return (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick(navigate);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: active ? "hsl(280 55% 55%)" : "hsl(280 30% 95%)",
                  color: active ? "white" : "hsl(280 40% 25%)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
