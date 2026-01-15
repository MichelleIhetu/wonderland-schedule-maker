import { motion } from "framer-motion";
import { Palette } from "lucide-react";
import { BackgroundTheme, backgroundThemes } from "@/types/schedule";
import { Button } from "@/components/ui/button";

interface ThemeSelectorProps {
  currentTheme: BackgroundTheme;
  onChange: (theme: BackgroundTheme) => void;
  onOpenCustomizer: () => void;
}

const ThemeSelector = ({ currentTheme, onChange, onOpenCustomizer }: ThemeSelectorProps) => {
  const themes = Object.entries(backgroundThemes) as [BackgroundTheme, typeof backgroundThemes[BackgroundTheme]][];

  return (
    <div className="flex flex-wrap gap-2 justify-center items-center">
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
      
      {/* Customize button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenCustomizer}
        className="gap-1 ml-2"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">Customize</span>
      </Button>
    </div>
  );
};

export default ThemeSelector;
