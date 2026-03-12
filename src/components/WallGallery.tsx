import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type FrameStyle = "wood" | "black" | "gold" | "white" | "rustic";

export interface GalleryImage {
  id: string;
  imageUrl: string;
  title: string;
}

interface WallGalleryProps {
  enabled: boolean;
  imageCount: 4 | 6 | 8 | 12;
  frameStyle?: FrameStyle;
  customImages?: GalleryImage[];
  rotateInterval?: number; // minutes: 0 = no rotation
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

const frameTilts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const getGridCols = (count: number) => {
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-3";
  if (count <= 8) return "grid-cols-4";
  return "grid-cols-4";
};

// Proxy pinimg URLs through a cors-friendly approach
const getProxiedUrl = (url: string) => {
  // Pinterest images often block direct hotlinking; use images.weserv.nl proxy
  if (url.includes('pinimg.com')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400&h=300&fit=cover&output=webp`;
  }
  return url;
};

const frameStyles: Record<FrameStyle, {
  outer: string;
  inner: string;
  mat: string;
  highlight: string;
  nail: string;
}> = {
  wood: {
    outer: "linear-gradient(145deg, hsl(30 30% 35%), hsl(25 25% 22%))",
    inner: "linear-gradient(145deg, hsl(30 20% 28%), hsl(25 20% 18%))",
    mat: "hsl(40 20% 95%)",
    highlight: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.1) 100%)",
    nail: "bg-muted-foreground/40",
  },
  black: {
    outer: "linear-gradient(145deg, hsl(0 0% 15%), hsl(0 0% 5%))",
    inner: "linear-gradient(145deg, hsl(0 0% 10%), hsl(0 0% 3%))",
    mat: "hsl(0 0% 96%)",
    highlight: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.15) 100%)",
    nail: "bg-muted-foreground/30",
  },
  gold: {
    outer: "linear-gradient(145deg, hsl(43 70% 55%), hsl(38 60% 35%))",
    inner: "linear-gradient(145deg, hsl(40 65% 48%), hsl(35 55% 30%))",
    mat: "hsl(45 30% 95%)",
    highlight: "linear-gradient(135deg, rgba(255,235,180,0.25) 0%, transparent 35%, transparent 55%, rgba(120,80,0,0.12) 100%)",
    nail: "bg-yellow-700/50",
  },
  white: {
    outer: "linear-gradient(145deg, hsl(0 0% 95%), hsl(0 0% 85%))",
    inner: "linear-gradient(145deg, hsl(0 0% 90%), hsl(0 0% 82%))",
    mat: "hsl(0 0% 98%)",
    highlight: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.04) 100%)",
    nail: "bg-muted-foreground/25",
  },
  rustic: {
    outer: "linear-gradient(145deg, hsl(20 40% 30%), hsl(15 35% 18%))",
    inner: "linear-gradient(145deg, hsl(18 30% 25%), hsl(12 25% 15%))",
    mat: "hsl(35 25% 90%)",
    highlight: "linear-gradient(135deg, rgba(255,220,180,0.08) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.12) 100%)",
    nail: "bg-amber-900/40",
  },
};

const WallGallery = ({ enabled, imageCount, frameStyle = "wood", customImages, rotateInterval = 0 }: WallGalleryProps) => {
  const { user } = useAuth();
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [rotationOffset, setRotationOffset] = useState(0);

  // Load images from custom source, saved boards, or defaults
  useEffect(() => {
    if (!enabled) return;

    if (customImages && customImages.length > 0) {
      setAllImages(customImages);
      return;
    }

    const loadImages = async () => {
      if (user) {
        const { data } = await supabase
          .from("moodboard_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setAllImages(
            data.map((item: any) => ({
              id: item.id,
              imageUrl: item.image_url,
              title: item.title || "Untitled",
            }))
          );
          return;
        }
      }
      setAllImages([...defaultImages].sort(() => Math.random() - 0.5));
    };

    loadImages();
  }, [enabled, customImages, user]);

  // Rotation timer
  useEffect(() => {
    if (!enabled || rotateInterval <= 0 || allImages.length <= imageCount) return;

    const interval = setInterval(() => {
      setRotationOffset((prev) => (prev + imageCount) % allImages.length);
    }, rotateInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, rotateInterval, allImages.length, imageCount]);

  if (!enabled || allImages.length === 0) return null;

  // Get current window of images based on rotation offset
  const displayImages: GalleryImage[] = [];
  for (let i = 0; i < imageCount; i++) {
    const idx = (rotationOffset + i) % allImages.length;
    displayImages.push(allImages[idx]);
  }

  const frame = frameStyles[frameStyle];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={rotationOffset}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      >
        {/* Wall texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />

        {/* Picture frames grid */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className={`grid ${getGridCols(imageCount)} gap-4 md:gap-6 max-w-full`}>
            {displayImages.map((img, i) => (
              <motion.div
                key={`${img.id}-${rotationOffset}`}
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
                {/* Nail on wall */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${frame.nail} shadow-sm z-10`} />
                {/* Wire/string */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-px h-3 bg-muted-foreground/25" />

                {/* Frame */}
                <div
                  className={`relative shadow-[0_4px_20px_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.15)] ${frameStyle === "gold" ? "rounded-[4px]" : "rounded-[3px]"}`}
                  style={{
                    background: frame.outer,
                    padding: frameStyle === "gold" ? "7px" : "6px",
                  }}
                >
                  {/* Inner frame bevel */}
                  <div
                    className={`${frameStyle === "gold" ? "rounded-[3px]" : "rounded-[2px]"}`}
                    style={{
                      background: frame.inner,
                      padding: "2px",
                    }}
                  >
                    {/* Mat / passepartout */}
                    <div className="p-1.5 md:p-2 rounded-[1px]" style={{ background: frame.mat }}>
                    <div className={`relative overflow-hidden ${i % 2 === 0 ? 'aspect-[4/3]' : 'aspect-[3/4]'}`}>
                        <img
                          src={getProxiedUrl(img.imageUrl)}
                          alt={img.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // Fallback: try original URL if proxy fails
                            if (target.src !== img.imageUrl) {
                              target.src = img.imageUrl;
                            }
                          }}
                        />
                        {/* Glass reflection */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Frame highlights */}
                  <div
                    className={`absolute inset-0 ${frameStyle === "gold" ? "rounded-[4px]" : "rounded-[3px]"} pointer-events-none`}
                    style={{ background: frame.highlight }}
                  />

                  {/* Gold ornate corner accents */}
                  {frameStyle === "gold" && (
                    <>
                      <div className="absolute top-0.5 left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 border-yellow-300/30 rounded-tl-[3px]" />
                      <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 border-yellow-300/30 rounded-tr-[3px]" />
                      <div className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 border-yellow-300/30 rounded-bl-[3px]" />
                      <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 border-yellow-300/30 rounded-br-[3px]" />
                    </>
                  )}
                </div>

                {/* Wall shadow behind frame */}
                <div className="absolute -inset-1 -z-10 rounded-sm bg-black/10 blur-md" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WallGallery;
