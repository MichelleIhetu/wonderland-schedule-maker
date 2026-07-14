import { useLocation } from "react-router-dom";

const routeLabels: Record<string, string> = {
  "/": "Landing / Home",
  "/auth": "Auth",
  "/welcome-back": "Welcome Back",
  "/goals": "Goals",
  "/moodboard": "Moodboard",
  "/vibe-check": "Vibe Check",
  "/pomodoro": "Pomodoro Timer",
};

export default function DevLabel() {
  const { pathname } = useLocation();

  // Only show in the Lovable editor/preview dev environment.
  if (!import.meta.env.DEV) return null;

  const label = routeLabels[pathname] ?? "Unknown Route";

  return (
    <div
      className="fixed top-2 right-2 z-[9999] px-2.5 py-1 rounded text-[10px] font-mono pointer-events-none select-none print:hidden"
      style={{
        background: "rgba(0, 0, 0, 0.75)",
        color: "#f0f0f0",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
      aria-hidden="true"
    >
      <span className="font-bold">{pathname}</span>
      <span className="mx-1.5 opacity-50">|</span>
      <span>{label}</span>
    </div>
  );
}
