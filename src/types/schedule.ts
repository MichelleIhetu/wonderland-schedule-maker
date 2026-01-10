export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type EnergyLevel = "motivated" | "unmotivated";
export type StressLevel = "low" | "medium" | "high";

export interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description?: string;
  suit: Suit;
}

export interface UserSettings {
  energyLevel: EnergyLevel;
  stressLevel: StressLevel;
  theme: Suit;
  wakeTime: string;
  bedTime: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const themeColors: Record<Suit, {
  primary: string;
  secondary: string;
  accent: string;
  name: string;
}> = {
  hearts: {
    primary: "hsl(350 70% 50%)",
    secondary: "hsl(350 60% 95%)",
    accent: "hsl(350 80% 60%)",
    name: "Queen of Hearts",
  },
  diamonds: {
    primary: "hsl(42 80% 50%)",
    secondary: "hsl(42 70% 95%)",
    accent: "hsl(42 90% 60%)",
    name: "Golden Treasury",
  },
  clubs: {
    primary: "hsl(150 40% 35%)",
    secondary: "hsl(150 30% 95%)",
    accent: "hsl(150 50% 45%)",
    name: "Enchanted Forest",
  },
  spades: {
    primary: "hsl(280 40% 45%)",
    secondary: "hsl(280 30% 95%)",
    accent: "hsl(280 50% 55%)",
    name: "Mystic Night",
  },
};
