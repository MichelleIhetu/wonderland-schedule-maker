import { UserSettings, Suit, EnergyLevel, StressLevel, themeColors } from "@/types/schedule";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Settings, Sparkles, Heart, Diamond, Club, Spade, Moon, Sun, Zap, Battery } from "lucide-react";
import { motion } from "framer-motion";

interface SettingsPanelProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const suitIcons: Record<Suit, React.ReactNode> = {
  hearts: <Heart className="w-5 h-5" />,
  diamonds: <Diamond className="w-5 h-5" />,
  clubs: <Club className="w-5 h-5" />,
  spades: <Spade className="w-5 h-5" />,
};

export default function SettingsPanel({ settings, onSettingsChange, isOpen, onToggle }: SettingsPanelProps) {
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={onToggle}
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 rounded-full shadow-float bg-card border-2"
      >
        <Settings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
      </Button>

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-float z-40 overflow-y-auto"
      >
        <div className="p-6 pt-16">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl">Personalize</h2>
          </div>

          {/* Theme Selection */}
          <div className="mb-6">
            <Label className="font-display text-sm mb-3 block">Wonderland Theme</Label>
            <RadioGroup
              value={settings.theme}
              onValueChange={(v) => updateSetting("theme", v as Suit)}
              className="grid grid-cols-2 gap-2"
            >
              {(["hearts", "diamonds", "clubs", "spades"] as Suit[]).map((suit) => (
                <div key={suit} className="relative">
                  <RadioGroupItem
                    value={suit}
                    id={`theme-${suit}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`theme-${suit}`}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:bg-muted"
                    style={{
                      borderColor: settings.theme === suit ? themeColors[suit].primary : undefined,
                    }}
                  >
                    <span style={{ color: themeColors[suit].primary }}>{suitIcons[suit]}</span>
                    <span className="text-xs font-body">{themeColors[suit].name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Energy Level */}
          <div className="mb-6">
            <Label className="font-display text-sm mb-3 block">Energy Level</Label>
            <RadioGroup
              value={settings.energyLevel}
              onValueChange={(v) => updateSetting("energyLevel", v as EnergyLevel)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="motivated" id="energy-motivated" />
                <Label htmlFor="energy-motivated" className="flex items-center gap-2 cursor-pointer font-body">
                  <Zap className="w-4 h-4 text-secondary" />
                  Motivated & Ready
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="unmotivated" id="energy-unmotivated" />
                <Label htmlFor="energy-unmotivated" className="flex items-center gap-2 cursor-pointer font-body">
                  <Battery className="w-4 h-4 text-muted-foreground" />
                  Need Gentle Push
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Stress Level */}
          <div className="mb-6">
            <Label className="font-display text-sm mb-3 block">Stress Level</Label>
            <RadioGroup
              value={settings.stressLevel}
              onValueChange={(v) => updateSetting("stressLevel", v as StressLevel)}
              className="space-y-2"
            >
              {[
                { value: "low", label: "Low - Feeling calm", color: "text-green-500" },
                { value: "medium", label: "Medium - Some pressure", color: "text-yellow-500" },
                { value: "high", label: "High - Overwhelmed", color: "text-accent" },
              ].map((level) => (
                <div key={level.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={level.value} id={`stress-${level.value}`} />
                  <Label htmlFor={`stress-${level.value}`} className={`cursor-pointer font-body ${level.color}`}>
                    {level.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Time Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="wake-time" className="font-display text-sm mb-2 flex items-center gap-2">
                <Sun className="w-4 h-4 text-secondary" />
                Wake Time
              </Label>
              <Input
                type="time"
                id="wake-time"
                value={settings.wakeTime}
                onChange={(e) => updateSetting("wakeTime", e.target.value)}
                className="font-body"
              />
            </div>
            <div>
              <Label htmlFor="bed-time" className="font-display text-sm mb-2 flex items-center gap-2">
                <Moon className="w-4 h-4 text-primary" />
                Bed Time
              </Label>
              <Input
                type="time"
                id="bed-time"
                value={settings.bedTime}
                onChange={(e) => updateSetting("bedTime", e.target.value)}
                className="font-body"
              />
            </div>
          </div>

          {/* Theme indicator */}
          <div 
            className="mt-8 p-4 rounded-lg text-center"
            style={{ backgroundColor: themeColors[settings.theme].secondary }}
          >
            <p className="font-body text-sm" style={{ color: themeColors[settings.theme].primary }}>
              Current theme: {themeColors[settings.theme].name}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onToggle}
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30"
        />
      )}
    </>
  );
}
