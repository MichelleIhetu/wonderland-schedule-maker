import { motion } from "framer-motion";
import { BackgroundTheme } from "@/types/schedule";

interface ThemeBackgroundProps {
  theme: BackgroundTheme;
}

const ThemeBackground = ({ theme }: ThemeBackgroundProps) => {
  switch (theme) {
    case "peppy-pink":
      return <PeppyPinkBackground />;
    case "ocean-calm":
      return <OceanCalmBackground />;
    case "sunset-warm":
      return <SunsetWarmBackground />;
    case "forest-zen":
      return <ForestZenBackground />;
    case "gothic":
    default:
      return null; // SpiderWebBackground handles this
  }
};

const PeppyPinkBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Gradient base */}
    <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-rose-100 to-pink-300" />
    
    {/* Floating hearts */}
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-pink-400/40"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          fontSize: `${20 + Math.random() * 40}px`,
        }}
        animate={{
          y: [-20, 20, -20],
          x: [-10, 10, -10],
          rotate: [-10, 10, -10],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 2,
          ease: "easeInOut",
        }}
      >
        ♡
      </motion.div>
    ))}
    
    {/* Sparkles */}
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={`sparkle-${i}`}
        className="absolute w-2 h-2 rounded-full bg-white/60"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.5, 0.5],
        }}
        transition={{
          duration: 2 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 3,
        }}
      />
    ))}
    
    {/* Soft cloud shapes */}
    <div className="absolute top-10 left-10 w-40 h-20 bg-white/30 rounded-full blur-3xl" />
    <div className="absolute bottom-20 right-20 w-60 h-30 bg-pink-200/40 rounded-full blur-3xl" />
    <div className="absolute top-1/2 left-1/4 w-32 h-16 bg-rose-200/30 rounded-full blur-2xl" />
  </div>
);

const OceanCalmBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Deep ocean gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-cyan-900 via-blue-900 to-slate-900" />
    
    {/* Waves */}
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute left-0 right-0 h-8 bg-gradient-to-r from-cyan-500/10 via-blue-400/20 to-cyan-500/10"
        style={{ bottom: `${i * 15 + 5}%` }}
        animate={{
          x: [-50, 50, -50],
          scaleY: [1, 1.2, 1],
        }}
        transition={{
          duration: 6 + i * 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.5,
        }}
      />
    ))}
    
    {/* Bubbles */}
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={`bubble-${i}`}
        className="absolute rounded-full border border-cyan-400/30 bg-cyan-400/10"
        style={{
          width: `${10 + Math.random() * 20}px`,
          height: `${10 + Math.random() * 20}px`,
          left: `${Math.random() * 100}%`,
          bottom: `-20px`,
        }}
        animate={{
          y: [0, -800],
          x: [0, Math.random() * 40 - 20],
          opacity: [0.6, 0],
        }}
        transition={{
          duration: 8 + Math.random() * 6,
          repeat: Infinity,
          delay: Math.random() * 5,
        }}
      />
    ))}
    
    {/* Light rays */}
    <div className="absolute top-0 left-1/4 w-20 h-full bg-gradient-to-b from-cyan-300/10 to-transparent rotate-12 blur-xl" />
    <div className="absolute top-0 right-1/3 w-16 h-full bg-gradient-to-b from-blue-300/10 to-transparent -rotate-6 blur-xl" />
  </div>
);

const SunsetWarmBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Sunset gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-orange-400 via-rose-500 to-purple-900" />
    
    {/* Sun */}
    <motion.div
      className="absolute top-20 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-gradient-to-b from-yellow-300 to-orange-400"
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.9, 1, 0.9],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        boxShadow: "0 0 80px 40px rgba(251, 146, 60, 0.4)",
      }}
    />
    
    {/* Clouds */}
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute bg-gradient-to-r from-orange-300/30 via-rose-200/40 to-orange-300/30 rounded-full blur-lg"
        style={{
          width: `${100 + Math.random() * 150}px`,
          height: `${30 + Math.random() * 40}px`,
          top: `${10 + Math.random() * 30}%`,
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          x: [-30, 30, -30],
        }}
        transition={{
          duration: 10 + i * 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
    
    {/* Stars appearing */}
    {[...Array(10)].map((_, i) => (
      <motion.div
        key={`star-${i}`}
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${60 + Math.random() * 35}%`,
        }}
        animate={{
          opacity: [0, 0.8, 0],
          scale: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 4,
        }}
      />
    ))}
  </div>
);

const ForestZenBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Forest gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-emerald-900 via-green-900 to-slate-900" />
    
    {/* Leaves falling */}
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-green-400/40"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-20px`,
          fontSize: `${16 + Math.random() * 12}px`,
        }}
        animate={{
          y: [0, 800],
          x: [0, Math.random() * 100 - 50],
          rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        }}
        transition={{
          duration: 10 + Math.random() * 8,
          repeat: Infinity,
          delay: Math.random() * 8,
          ease: "linear",
        }}
      >
        🍃
      </motion.div>
    ))}
    
    {/* Fireflies */}
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={`firefly-${i}`}
        className="absolute w-2 h-2 rounded-full bg-yellow-300/70"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${30 + Math.random() * 60}%`,
          boxShadow: "0 0 10px 4px rgba(253, 224, 71, 0.4)",
        }}
        animate={{
          opacity: [0, 1, 0],
          x: [0, Math.random() * 60 - 30],
          y: [0, Math.random() * 60 - 30],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 4,
        }}
      />
    ))}
    
    {/* Mist */}
    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-green-900/50 to-transparent" />
    <motion.div
      className="absolute bottom-10 left-0 right-0 h-20 bg-white/5 blur-xl"
      animate={{
        x: [-20, 20, -20],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </div>
);

export default ThemeBackground;
