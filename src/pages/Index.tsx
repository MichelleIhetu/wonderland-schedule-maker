import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import WonderlandClock from "@/components/WonderlandClock";
import ScheduleCard from "@/components/ScheduleCard";
import AddScheduleModal from "@/components/AddScheduleModal";
import FloatingCard from "@/components/FloatingCard";
import { Button } from "@/components/ui/button";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description?: string;
  suit: "hearts" | "diamonds" | "clubs" | "spades";
}

const initialSchedule: ScheduleItem[] = [
  {
    id: "1",
    title: "Morning Tea Party",
    time: "09:00",
    description: "Join the Mad Hatter for breakfast and riddles",
    suit: "hearts",
  },
  {
    id: "2",
    title: "Garden Painting",
    time: "11:00",
    description: "Help paint the roses red before the Queen arrives",
    suit: "diamonds",
  },
  {
    id: "3",
    title: "Chess Lessons",
    time: "14:00",
    description: "Learn the ways of the Looking Glass world",
    suit: "spades",
  },
  {
    id: "4",
    title: "Croquet Match",
    time: "16:00",
    description: "Practice with flamingo mallets and hedgehog balls",
    suit: "clubs",
  },
];

const Index = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  const handleAddItem = (item: Omit<ScheduleItem, "id">) => {
    if (editingItem) {
      setSchedule((prev) =>
        prev.map((s) =>
          s.id === editingItem.id ? { ...s, ...item } : s
        )
      );
      setEditingItem(null);
    } else {
      const newItem: ScheduleItem = {
        ...item,
        id: Date.now().toString(),
      };
      setSchedule((prev) => [...prev, newItem]);
    }
  };

  const handleDeleteItem = (id: string) => {
    setSchedule((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEditItem = (id: string) => {
    const item = schedule.find((s) => s.id === id);
    if (item) {
      setEditingItem(item);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Sort schedule by time
  const sortedSchedule = [...schedule].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating decorative cards */}
      <FloatingCard suit="hearts" className="top-20 left-[5%] opacity-40" delay={0} />
      <FloatingCard suit="diamonds" className="top-40 right-[8%] opacity-30" delay={1} />
      <FloatingCard suit="clubs" className="bottom-32 left-[10%] opacity-30" delay={2} />
      <FloatingCard suit="spades" className="bottom-48 right-[5%] opacity-40" delay={0.5} />
      <FloatingCard suit="hearts" className="top-[60%] left-[3%] opacity-20" delay={1.5} />
      <FloatingCard suit="diamonds" className="top-[30%] right-[3%] opacity-25" delay={2.5} />

      {/* Main content */}
      <div className="container max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 text-sm font-body text-muted-foreground mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Curiouser and curiouser</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-3">
            Wonderland Schedule
          </h1>
          <p className="text-lg text-muted-foreground font-body max-w-md mx-auto">
            "I'm late! I'm late! For a very important date!"
          </p>
        </header>

        {/* Clock */}
        <div className="mb-12">
          <WonderlandClock />
          <p className="text-center text-sm text-muted-foreground mt-4 font-body italic">
            Time is a funny thing in Wonderland...
          </p>
        </div>

        {/* Add button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="font-display gradient-wonderland text-primary-foreground hover:opacity-90 transition-opacity gap-2 px-6"
          >
            <Plus className="w-5 h-5" />
            Add New Adventure
          </Button>
        </div>

        {/* Schedule list */}
        <div className="space-y-4">
          {sortedSchedule.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-body text-lg">
                Your schedule is as empty as the Cheshire Cat's grin...
              </p>
              <p className="text-sm text-muted-foreground/70 font-body mt-2">
                Add your first adventure above!
              </p>
            </div>
          ) : (
            sortedSchedule.map((item) => (
              <ScheduleCard
                key={item.id}
                {...item}
                onDelete={handleDeleteItem}
                onEdit={handleEditItem}
              />
            ))
          )}
        </div>

        {/* Footer quote */}
        <footer className="mt-16 text-center">
          <blockquote className="font-body italic text-muted-foreground">
            "Begin at the beginning," the King said, gravely, "and go on till you
            come to the end: then stop."
          </blockquote>
          <p className="text-xs text-muted-foreground/60 mt-2 font-display">
            — Lewis Carroll
          </p>
        </footer>
      </div>

      {/* Modal */}
      <AddScheduleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddItem}
        editItem={editingItem}
      />
    </div>
  );
};

export default Index;
