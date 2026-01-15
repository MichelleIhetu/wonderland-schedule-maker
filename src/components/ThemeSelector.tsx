import { motion } from "framer-motion";
import { BackgroundTheme, backgroundThemes } from "@/types/schedule";

interface ThemeSelectorProps {
  currentTheme: BackgroundTheme;
  onChange: (theme: BackgroundTheme) => void;
}

const ThemeSelector = ({ currentTheme, onChange }: ThemeSelectorProps) => {
  const themes = Object.entries(backgroundThemes) as [BackgroundTheme, typeof backgroundThemes[BackgroundTheme]][];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {themes.map(([key, theme]) => (
        <motion.button
          key={key}
          onClick={() => onChange(key)}
          className={`
            px-3 py-2 rounded-xl text-sm font-body
            border-2 transition-all duration-200
            ${currentTheme === key 
              ? "border-primary bg-primary/20 shadow-glow" 
              : "border-border bg-card/50 hover:border-primary/50"
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="mr-1">{theme.emoji}</span>
          <span className="hidden sm:inline">{theme.name}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default ThemeSelector;
