import { Clock, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleCardProps {
  id: string;
  title: string;
  time: string;
  description?: string;
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const suitIcons = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const suitStyles = {
  hearts: "border-wonderland-rose/30 hover:border-wonderland-rose",
  diamonds: "border-wonderland-gold/30 hover:border-wonderland-gold",
  clubs: "border-wonderland-forest/30 hover:border-wonderland-forest",
  spades: "border-wonderland-teal/30 hover:border-wonderland-teal",
};

const suitTextStyles = {
  hearts: "text-wonderland-rose",
  diamonds: "text-wonderland-gold",
  clubs: "text-wonderland-forest",
  spades: "text-wonderland-teal",
};

const ScheduleCard = ({
  id,
  title,
  time,
  description,
  suit,
  onDelete,
  onEdit,
}: ScheduleCardProps) => {
  return (
    <div
      className={cn(
        "group relative bg-card rounded-lg border-2 p-4 shadow-card transition-all duration-300 hover:shadow-float hover:-translate-y-1",
        suitStyles[suit]
      )}
    >
      {/* Suit decorations */}
      <span
        className={cn(
          "absolute top-2 left-3 text-2xl opacity-20 font-display",
          suitTextStyles[suit]
        )}
      >
        {suitIcons[suit]}
      </span>
      <span
        className={cn(
          "absolute bottom-2 right-3 text-2xl opacity-20 font-display rotate-180",
          suitTextStyles[suit]
        )}
      >
        {suitIcons[suit]}
      </span>

      {/* Content */}
      <div className="relative z-10 ml-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-body">{time}</span>
        </div>
        <h3 className="font-display text-lg text-foreground mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground font-body line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(id)}
          className="p-1.5 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(id)}
          className="p-1.5 rounded-md bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ScheduleCard;
