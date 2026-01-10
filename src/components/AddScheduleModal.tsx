import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description?: string;
  suit: "hearts" | "diamonds" | "clubs" | "spades";
}

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ScheduleItem, "id">) => void;
  editItem?: ScheduleItem | null;
}

const suits: Array<{ value: ScheduleItem["suit"]; icon: string; label: string }> = [
  { value: "hearts", icon: "♥", label: "Hearts" },
  { value: "diamonds", icon: "♦", label: "Diamonds" },
  { value: "clubs", icon: "♣", label: "Clubs" },
  { value: "spades", icon: "♠", label: "Spades" },
];

const AddScheduleModal = ({ isOpen, onClose, onAdd, editItem }: AddScheduleModalProps) => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [suit, setSuit] = useState<ScheduleItem["suit"]>("hearts");

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setTime(editItem.time);
      setDescription(editItem.description || "");
      setSuit(editItem.suit);
    } else {
      setTitle("");
      setTime("");
      setDescription("");
      setSuit("hearts");
    }
  }, [editItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !time) return;
    onAdd({ title, time, description, suit });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card rounded-xl border-2 border-secondary shadow-float p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl text-foreground">
            {editItem ? "Edit Your Task" : "Down the Rabbit Hole"}
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {editItem ? "Update your scheduled adventure" : "Add a new adventure to your schedule"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-display text-sm">
              What awaits?
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tea with the Mad Hatter..."
              className="font-body"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="font-display text-sm">
              When is tea time?
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="font-body"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-display text-sm">
              Tell me more (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Curiouser and curiouser..."
              className="font-body resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-display text-sm">Choose your card</Label>
            <div className="flex gap-2">
              {suits.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSuit(s.value)}
                  className={`flex-1 py-3 rounded-lg border-2 transition-all font-display text-2xl ${
                    suit === s.value
                      ? s.value === "hearts" || s.value === "diamonds"
                        ? "border-wonderland-rose bg-wonderland-rose/10 text-wonderland-rose"
                        : "border-foreground bg-foreground/10 text-foreground"
                      : "border-muted hover:border-secondary"
                  }`}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full font-display gradient-wonderland text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {editItem ? "Update Adventure" : "Add to Schedule"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddScheduleModal;
