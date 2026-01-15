import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Bookmark, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeBackground from "@/components/ThemeBackground";
import SpiderWebBackground from "@/components/SpiderWebBackground";

interface MoodboardItem {
  id: string;
  imageUrl: string;
  title: string;
  height: "short" | "medium" | "tall";
}

interface Aesthetic {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  items: MoodboardItem[];
}

const aesthetics: Aesthetic[] = [
  {
    id: "academic-weapon",
    name: "Academic Weapon",
    emoji: "📚",
    description: "Peak productivity & study motivation",
    color: "#8b4513",
    items: [
      { id: "aw1", imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400", title: "Study Setup", height: "tall" },
      { id: "aw2", imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400", title: "Book Stack", height: "medium" },
      { id: "aw3", imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400", title: "Notes & Coffee", height: "short" },
      { id: "aw4", imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400", title: "Library Goals", height: "tall" },
      { id: "aw5", imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400", title: "Study Group", height: "medium" },
      { id: "aw6", imageUrl: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400", title: "Desk Aesthetic", height: "short" },
    ],
  },
  {
    id: "dark-academia",
    name: "Dark Academia",
    emoji: "🖋️",
    description: "Gothic scholarly vibes",
    color: "#2d1b0e",
    items: [
      { id: "da1", imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400", title: "Ancient Library", height: "tall" },
      { id: "da2", imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400", title: "Reading Nook", height: "medium" },
      { id: "da3", imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400", title: "Vintage Books", height: "tall" },
      { id: "da4", imageUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400", title: "Candlelit Study", height: "short" },
      { id: "da5", imageUrl: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400", title: "Typewriter", height: "medium" },
    ],
  },
  {
    id: "cozy-study",
    name: "Cozy Study",
    emoji: "☕",
    description: "Warm & comfortable productivity",
    color: "#d4a574",
    items: [
      { id: "cs1", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", title: "Coffee & Books", height: "medium" },
      { id: "cs2", imageUrl: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=400", title: "Home Office", height: "tall" },
      { id: "cs3", imageUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400", title: "Blanket Season", height: "short" },
      { id: "cs4", imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400", title: "Laptop Work", height: "medium" },
      { id: "cs5", imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400", title: "Coding Setup", height: "tall" },
    ],
  },
  {
    id: "minimalist-focus",
    name: "Minimalist Focus",
    emoji: "🤍",
    description: "Clean & distraction-free",
    color: "#f5f5f5",
    items: [
      { id: "mf1", imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400", title: "Clean Desk", height: "medium" },
      { id: "mf2", imageUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400", title: "White Space", height: "tall" },
      { id: "mf3", imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400", title: "Simple Setup", height: "short" },
      { id: "mf4", imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400", title: "Morning Work", height: "medium" },
    ],
  },
  {
    id: "nature-study",
    name: "Nature Study",
    emoji: "🌿",
    description: "Outdoor inspiration & greenery",
    color: "#2d5a27",
    items: [
      { id: "ns1", imageUrl: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400", title: "Plant Corner", height: "tall" },
      { id: "ns2", imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400", title: "Garden Study", height: "medium" },
      { id: "ns3", imageUrl: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400", title: "Green Desk", height: "short" },
      { id: "ns4", imageUrl: "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400", title: "Window View", height: "tall" },
    ],
  },
  {
    id: "night-owl",
    name: "Night Owl",
    emoji: "🌙",
    description: "Late night productivity vibes",
    color: "#1a1a2e",
    items: [
      { id: "no1", imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400", title: "Night Coding", height: "medium" },
      { id: "no2", imageUrl: "https://images.unsplash.com/photo-1536859355448-76f92ebdc33d?w=400", title: "City Lights", height: "tall" },
      { id: "no3", imageUrl: "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=400", title: "Dark Mode", height: "short" },
      { id: "no4", imageUrl: "https://images.unsplash.com/photo-1550439062-609e1531270e?w=400", title: "Late Night", height: "medium" },
    ],
  },
];

const Moodboard = () => {
  const [selectedAesthetic, setSelectedAesthetic] = useState<Aesthetic | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  const filteredAesthetics = aesthetics.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSave = (itemId: string) => {
    setSavedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const heightClasses = {
    short: "h-40",
    medium: "h-56",
    tall: "h-72",
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpiderWebBackground />

      <div className="container max-w-6xl mx-auto px-4 py-6 relative z-10 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-2xl md:text-3xl text-foreground">
                ✨ Moodboard
              </h1>
              <p className="text-sm text-muted-foreground font-body">
                Find your study aesthetic
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search aesthetics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </header>

        {/* Mobile Search */}
        <div className="relative mb-6 md:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search aesthetics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <AnimatePresence mode="wait">
          {selectedAesthetic ? (
            /* Aesthetic Detail View */
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Back button and title */}
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAesthetic(null)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h2 className="font-display text-xl flex items-center gap-2">
                    {selectedAesthetic.emoji} {selectedAesthetic.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedAesthetic.description}
                  </p>
                </div>
              </div>

              {/* Masonry Grid */}
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {selectedAesthetic.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="break-inside-avoid group relative rounded-xl overflow-hidden shadow-card"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className={`w-full object-cover ${heightClasses[item.height]} transition-transform duration-300 group-hover:scale-105`}
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-body">{item.title}</p>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => toggleSave(item.id)}
                          className={`p-2 rounded-full transition-colors ${
                            savedItems.has(item.id)
                              ? "bg-primary text-white"
                              : "bg-white/90 text-gray-700 hover:bg-white"
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Inspiration tip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border text-center"
              >
                <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-body">
                  Save images that inspire you and use them to design your perfect study space!
                </p>
              </motion.div>
            </motion.div>
          ) : (
            /* Aesthetic Categories Grid */
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAesthetics.map((aesthetic, index) => (
                  <motion.button
                    key={aesthetic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedAesthetic(aesthetic)}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-card hover:shadow-float transition-all duration-300 text-left"
                  >
                    {/* Preview images grid */}
                    <div className="grid grid-cols-3 gap-0.5 h-32 overflow-hidden">
                      {aesthetic.items.slice(0, 3).map((item) => (
                        <img
                          key={item.id}
                          src={item.imageUrl}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ))}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{aesthetic.emoji}</span>
                        <h3 className="font-display text-lg text-foreground">
                          {aesthetic.name}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground font-body">
                        {aesthetic.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{aesthetic.items.length} images</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {filteredAesthetics.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground font-body">
                    No aesthetics found for "{searchQuery}"
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved items indicator */}
        {savedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <Heart className="w-4 h-4 fill-current" />
            <span className="font-body text-sm">{savedItems.size} saved</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Moodboard;