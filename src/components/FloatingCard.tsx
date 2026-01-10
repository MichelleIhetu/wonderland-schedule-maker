import { cn } from "@/lib/utils";

interface FloatingCardProps {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  className?: string;
  delay?: number;
}

const suitIcons = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const suitColors = {
  hearts: "text-wonderland-rose",
  diamonds: "text-wonderland-gold",
  clubs: "text-wonderland-forest",
  spades: "text-wonderland-teal",
};

const FloatingCard = ({ suit, className, delay = 0 }: FloatingCardProps) => {
  return (
    <div
      className={cn(
        "absolute w-12 h-16 bg-card rounded-md border border-secondary/30 flex items-center justify-center shadow-card animate-float pointer-events-none",
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className={cn("text-2xl font-display", suitColors[suit])}>
        {suitIcons[suit]}
      </span>
    </div>
  );
};

export default FloatingCard;
