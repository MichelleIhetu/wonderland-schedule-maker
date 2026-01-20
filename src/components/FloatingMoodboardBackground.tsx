import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MoodboardImage {
  id: string;
  imageUrl: string;
  title: string;
}

// Curated images from different aesthetics for ambient background
const ambientImages: MoodboardImage[] = [
  { id: "aw1", imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400", title: "Study Setup" },
  { id: "da1", imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400", title: "Ancient Library" },
  { id: "cs1", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", title: "Coffee & Books" },
  { id: "mf2", imageUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400", title: "White Space" },
  { id: "ns1", imageUrl: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400", title: "Plant Corner" },
  { id: "no2", imageUrl: "https://images.unsplash.com/photo-1536859355448-76f92ebdc33d?w=400", title: "City Lights" },
  { id: "da3", imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400", title: "Vintage Books" },
  { id: "cs5", imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400", title: "Coding Setup" },
];

interface FloatingImage {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  duration: number;
  delay: number;
}

interface FloatingMoodboardBackgroundProps {
  enabled: boolean;
  opacity?: number;
}

const FloatingMoodboardBackground = ({ enabled, opacity = 0.15 }: FloatingMoodboardBackgroundProps) => {
  const [floatingImages, setFloatingImages] = useState<FloatingImage[]>([]);

  useEffect(() => {
    if (!enabled) {
      setFloatingImages([]);
      return;
    }

    // Create 5-6 floating images with random positions
    const shuffled = [...ambientImages].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 6);

    const images: FloatingImage[] = selected.map((img, index) => ({
      id: `float-${img.id}-${index}`,
      imageUrl: img.imageUrl,
      x: Math.random() * 80 + 10, // 10-90% of container width
      y: Math.random() * 80 + 10, // 10-90% of container height
      scale: Math.random() * 0.3 + 0.5, // 0.5-0.8 scale
      rotation: Math.random() * 20 - 10, // -10 to 10 degrees
      duration: Math.random() * 10 + 20, // 20-30 seconds per float cycle
      delay: index * 0.5,
    }));

    setFloatingImages(images);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <AnimatePresence>
        {floatingImages.map((img) => (
          <motion.div
            key={img.id}
            className="absolute"
            initial={{
              x: `${img.x}%`,
              y: `${img.y}%`,
              scale: img.scale,
              rotate: img.rotation,
              opacity: 0,
            }}
            animate={{
              x: [
                `${img.x}%`,
                `${img.x + (Math.random() * 10 - 5)}%`,
                `${img.x - (Math.random() * 10 - 5)}%`,
                `${img.x}%`,
              ],
              y: [
                `${img.y}%`,
                `${img.y - (Math.random() * 8 - 4)}%`,
                `${img.y + (Math.random() * 8 - 4)}%`,
                `${img.y}%`,
              ],
              rotate: [img.rotation, img.rotation + 3, img.rotation - 3, img.rotation],
              opacity: opacity,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: img.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: img.delay,
            }}
            style={{
              transform: `translate(-50%, -50%)`,
            }}
          >
            <div
              className="rounded-xl overflow-hidden shadow-lg"
              style={{
                width: `${80 + img.scale * 60}px`,
                height: `${60 + img.scale * 50}px`,
              }}
            >
              <img
                src={img.imageUrl}
                alt=""
                className="w-full h-full object-cover blur-[1px]"
                loading="lazy"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingMoodboardBackground;
