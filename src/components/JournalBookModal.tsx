import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import journalBook from "@/assets/journal-book.png";

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
}

interface JournalBookModalProps {
  open: boolean;
  onClose: () => void;
}

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const JournalBookModal = ({ open, onClose }: JournalBookModalProps) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("journal_entries")
      .select("id, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Failed to load journal entries", error);
        setEntries((data as JournalEntry[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border-4 border-primary/40 shadow-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-primary/20 bg-primary/10">
              <div className="flex items-center gap-3">
                <img
                  src={journalBook}
                  alt="Journal book"
                  width={40}
                  height={40}
                  loading="lazy"
                  className="w-10 h-10 [image-rendering:pixelated] drop-shadow"
                />
                <h2
                  className="text-lg text-foreground"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  My Journal
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close journal book"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Opening your book...
                </div>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <BookOpen className="w-10 h-10 mb-3 opacity-60" />
                  <p style={{ fontFamily: "var(--font-body)" }}>
                    No entries yet. Write about your day and it'll be saved here.
                  </p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border-2 border-primary/20 bg-background/60 p-4 shadow-sm"
                  >
                    <div
                      className="text-xs text-primary mb-2"
                      style={{ fontFamily: "'Press Start 2P', monospace" }}
                    >
                      {formatWhen(entry.created_at)}
                    </div>
                    <p
                      className="text-sm text-foreground whitespace-pre-wrap leading-relaxed"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {entry.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JournalBookModal;
