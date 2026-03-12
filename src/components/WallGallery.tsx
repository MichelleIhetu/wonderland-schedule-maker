import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WallGalleryProps {
  enabled: boolean;
  imageCount: 4 | 6 | 8 | 12;
}

interface GalleryImage {
  id: string;
  imageUrl: string;
  title: string;
}

const defaultImages: GalleryImage[] = [
  { id: "w1", imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400", title: "Study Setup" },
  { id: "w2", imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400", title: "Library" },
  { id: "w3", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", title: "Coffee & Books" },
  { id: "w4", imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400", title: "Vintage Books" },
  { id: "w5", imageUrl: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400", title: "Plant Corner" },
  { id: "w6", imageUrl: "https://images.unsplash.com/photo-1536859355448-76f92ebdc33d?w=400", title: "City Lights" },
  { id: "w7", imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400", title: "Coding Setup" },
  { id: "w8", imageUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400", title: "White Space" },
  { id: "w9", imageUrl: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=400", title: "Home Office" },
  { id: "w10", imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400", title: "Reading Nook" },
  { id: "w11", imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400", title: "Laptop Work" },
  { id: "w12", imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400", title: "Night Coding" },
];

// Slight random tilt for each frame to look like hung pictures
const frameTilts = [-3, 2, -1, 3, -2, 1, -3, 2, 1, -2, 3, -1];

const getGridCols = (count: number) => {
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-3";
  if (count <= 8) return "grid-cols-4";
  return "grid-cols-4";
};

const WallGallery = ({ enabled, imageCount }: WallGalleryProps) => {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const loadImages = async () => {
      if (user) {
        // Try loading from saved moodboard items
        const { data } = await supabase
          .from("moodboard_items")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(imageCount);

        if (data && data.length > 0) {
          setImages(
            data.map((item: any) => ({
              id: item.id,
              imageUrl: item.image_url,
              title: item.title || "Untitled",
            }))
          );
          return;
        }
      }
      // Fallback to defaults
      const shuffled = [...defaultImages].sort(() => Math.random() - 0.5);
      setImages(shuffled.slice(0, imageCount));
    };

    loadImages();
  }, [enabled, imageCount, user]);

  if (!enabled || images.length === 0) return null;

  const displayImages = images.slice(0, imageCount);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      >
        {/* Wall texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />

        {/* Picture frames grid */}
        <div className={`absolute inset-0 flex items-center justify-center p-8`}>
          <div className={`grid ${getGridCols(imageCount)} gap-4 md:gap-6 max-w-full`}>
            {displayImages.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: -20, rotate: 0 }}
                animate={{
                  opacity: 0.7,
                  y: 0,
                  rotate: frameTilts[i % frameTilts.length],
                }}
                transition={{
                  delay: i * 0.1,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 120,
                }}
                className="relative group"
              >
                {/* Wire/string from top */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-muted-foreground/20" />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />

                {/* Frame */}
                <div className="relative bg-card border-2 border-muted-foreground/10 rounded-sm shadow-lg p-1 md:p-1.5">
                  {/* Inner mat */}
                  <div className="bg-background/50 p-0.5 md:p-1">
                    <img
                      src={img.imageUrl}
                      alt={img.title}
                      className="w-16 h-12 sm:w-20 sm:h-14 md:w-24 md:h-18 lg:w-28 lg:h-20 object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Subtle glass reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-sm pointer-events-none" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WallGallery;
