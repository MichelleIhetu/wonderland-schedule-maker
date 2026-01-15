import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, X, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BackgroundTheme } from "@/types/schedule";

export interface CustomColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  foreground: string;
}

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: BackgroundTheme;
  customColors: CustomColors;
  onColorsChange: (colors: CustomColors) => void;
  onReset: () => void;
}

const defaultThemeColors: Record<BackgroundTheme, CustomColors> = {
  gothic: {
    primary: "#a855f7",
    secondary: "#3b1f5c",
    accent: "#c026d3",
    background: "#0d0815",
    card: "#1a1025",
    foreground: "#e9e3f0",
  },
  "peppy-pink": {
    primary: "#ec4899",
    secondary: "#fce7f3",
    accent: "#f43f5e",
    background: "#fdf2f8",
    card: "#fefcfd",
    foreground: "#4a1d34",
  },
  "ocean-calm": {
    primary: "#06b6d4",
    secondary: "#1e3a5f",
    accent: "#14b8a6",
    background: "#0c1929",
    card: "#1a2f47",
    foreground: "#e0f2fe",
  },
  "sunset-warm": {
    primary: "#f97316",
    secondary: "#44281a",
    accent: "#ef4444",
    background: "#1a0f08",
    card: "#2d1810",
    foreground: "#fef3e2",
  },
  "forest-zen": {
    primary: "#22c55e",
    secondary: "#1a3329",
    accent: "#84cc16",
    background: "#0d1a14",
    card: "#1a2f24",
    foreground: "#dcfce7",
  },
};

const colorLabels: Record<keyof CustomColors, { label: string; description: string }> = {
  primary: { label: "Primary", description: "Main accent color for buttons and highlights" },
  secondary: { label: "Secondary", description: "Background for cards and sections" },
  accent: { label: "Accent", description: "Eye-catching elements and links" },
  background: { label: "Background", description: "Main page background" },
  card: { label: "Card", description: "Card and panel backgrounds" },
  foreground: { label: "Text", description: "Main text color" },
};

const ThemeCustomizer = ({
  isOpen,
  onClose,
  currentTheme,
  customColors,
  onColorsChange,
  onReset,
}: ThemeCustomizerProps) => {
  const [localColors, setLocalColors] = useState<CustomColors>(customColors);

  const handleColorChange = (key: keyof CustomColors, value: string) => {
    const newColors = { ...localColors, [key]: value };
    setLocalColors(newColors);
    onColorsChange(newColors);
  };

  const handleReset = () => {
    const defaults = defaultThemeColors[currentTheme];
    setLocalColors(defaults);
    onColorsChange(defaults);
    onReset();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg text-foreground">Customize Theme</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Color preview */}
            <div className="p-4 border-b border-border">
              <div className="flex gap-1 justify-center">
                {Object.values(localColors).map((color, i) => (
                  <motion.div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-border shadow-sm"
                    style={{ backgroundColor: color }}
                    whileHover={{ scale: 1.1 }}
                  />
                ))}
              </div>
            </div>

            {/* Color pickers */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(Object.keys(colorLabels) as Array<keyof CustomColors>).map((key) => (
                <motion.div
                  key={key}
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Object.keys(colorLabels).indexOf(key) * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-display text-foreground">
                      {colorLabels[key].label}
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localColors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-border overflow-hidden"
                        style={{ padding: 0 }}
                      />
                      <input
                        type="text"
                        value={localColors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-20 px-2 py-1 text-xs font-mono bg-background border border-border rounded text-foreground"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {colorLabels[key].description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border space-y-2">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </Button>
              <Button
                className="w-full gap-2"
                onClick={onClose}
              >
                <Sparkles className="w-4 h-4" />
                Apply Changes
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export { defaultThemeColors };
export default ThemeCustomizer;
