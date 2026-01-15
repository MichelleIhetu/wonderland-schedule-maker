import { motion } from "framer-motion";

interface CartoonBunnyProps {
  mood?: "happy" | "encouraging" | "celebrating" | "focused";
  size?: "sm" | "md" | "lg";
  message?: string;
}

const CartoonBunny = ({ mood = "happy", size = "md", message }: CartoonBunnyProps) => {
  const sizeScale = {
    sm: 0.6,
    md: 0.8,
    lg: 1,
  };

  const scale = sizeScale[size];

  // Different expressions based on mood
  const getExpression = () => {
    switch (mood) {
      case "celebrating":
        return { eyeShape: "star", mouthOpen: true };
      case "focused":
        return { eyeShape: "determined", mouthOpen: false };
      case "encouraging":
        return { eyeShape: "wink", mouthOpen: true };
      default:
        return { eyeShape: "normal", mouthOpen: true };
    }
  };

  const expression = getExpression();

  return (
    <motion.div 
      className="flex flex-col items-center gap-3"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        style={{ transform: `scale(${scale})` }}
      >
        <svg width="100" height="110" viewBox="0 0 100 110" className="drop-shadow-lg">
          {/* Ears */}
          <motion.ellipse
            cx="30"
            cy="22"
            rx="10"
            ry="25"
            fill="#f5f5f5"
            stroke="#2d2d2d"
            strokeWidth="2.5"
            animate={{ rotate: [-8, 8, -8] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{ transformOrigin: "30px 47px" }}
          />
          <ellipse cx="30" cy="22" rx="5" ry="16" fill="#ffb6c1" />
          
          <motion.ellipse
            cx="70"
            cy="22"
            rx="10"
            ry="25"
            fill="#f5f5f5"
            stroke="#2d2d2d"
            strokeWidth="2.5"
            animate={{ rotate: [8, -8, 8] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0.1 }}
            style={{ transformOrigin: "70px 47px" }}
          />
          <ellipse cx="70" cy="22" rx="5" ry="16" fill="#ffb6c1" />
          
          {/* Head */}
          <ellipse cx="50" cy="62" rx="35" ry="30" fill="#f5f5f5" stroke="#2d2d2d" strokeWidth="2.5" />
          
          {/* Cheek puffs */}
          <ellipse cx="22" cy="68" rx="10" ry="8" fill="#f5f5f5" stroke="#2d2d2d" strokeWidth="2" />
          <ellipse cx="78" cy="68" rx="10" ry="8" fill="#f5f5f5" stroke="#2d2d2d" strokeWidth="2" />
          
          {/* Eyes */}
          {expression.eyeShape === "star" ? (
            <>
              <text x="35" y="60" fontSize="16" fill="#fbbf24" stroke="#2d2d2d" strokeWidth="0.5">★</text>
              <text x="55" y="60" fontSize="16" fill="#fbbf24" stroke="#2d2d2d" strokeWidth="0.5">★</text>
            </>
          ) : expression.eyeShape === "wink" ? (
            <>
              <ellipse cx="38" cy="55" rx="8" ry="10" fill="white" stroke="#2d2d2d" strokeWidth="2" />
              <circle cx="40" cy="57" r="4" fill="#2d2d2d" />
              <circle cx="42" cy="55" r="1.5" fill="white" />
              <path d="M55 55 Q62 50 69 55" fill="none" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : expression.eyeShape === "determined" ? (
            <>
              <ellipse cx="38" cy="55" rx="8" ry="8" fill="white" stroke="#2d2d2d" strokeWidth="2" />
              <ellipse cx="62" cy="55" rx="8" ry="8" fill="white" stroke="#2d2d2d" strokeWidth="2" />
              <circle cx="40" cy="56" r="4" fill="#2d2d2d" />
              <circle cx="64" cy="56" r="4" fill="#2d2d2d" />
              <path d="M30 48 L46 52" fill="none" stroke="#2d2d2d" strokeWidth="2" strokeLinecap="round" />
              <path d="M70 48 L54 52" fill="none" stroke="#2d2d2d" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="38" cy="55" rx="8" ry="10" fill="white" stroke="#2d2d2d" strokeWidth="2" />
              <ellipse cx="62" cy="55" rx="8" ry="10" fill="white" stroke="#2d2d2d" strokeWidth="2" />
              <motion.g
                animate={{ x: [0, 2, 0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <circle cx="40" cy="57" r="4" fill="#2d2d2d" />
                <circle cx="64" cy="57" r="4" fill="#2d2d2d" />
                <circle cx="42" cy="55" r="1.5" fill="white" />
                <circle cx="66" cy="55" r="1.5" fill="white" />
              </motion.g>
            </>
          )}
          
          {/* Nose */}
          <ellipse cx="50" cy="72" rx="5" ry="3.5" fill="#ffb6c1" stroke="#2d2d2d" strokeWidth="1.5" />
          
          {/* Mouth */}
          {expression.mouthOpen ? (
            <path d="M38 80 Q50 92 62 80" fill="none" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <path d="M42 80 Q50 85 58 80" fill="none" stroke="#2d2d2d" strokeWidth="2" strokeLinecap="round" />
          )}
          
          {/* Buck teeth */}
          <rect x="45" y="80" width="5" height="6" rx="1" fill="white" stroke="#2d2d2d" strokeWidth="1" />
          <rect x="50" y="80" width="5" height="6" rx="1" fill="white" stroke="#2d2d2d" strokeWidth="1" />
          
          {/* Body hint */}
          <ellipse cx="50" cy="100" rx="20" ry="12" fill="#f5f5f5" stroke="#2d2d2d" strokeWidth="2.5" />
        </svg>

        {/* Sparkles for celebrating */}
        {mood === "celebrating" && (
          <>
            <motion.span
              className="absolute -top-2 -left-2 text-yellow-400 text-lg"
              animate={{ scale: [0, 1, 0], rotate: [0, 180] }}
              transition={{ repeat: Infinity, duration: 1, repeatDelay: 0.5 }}
            >
              ✦
            </motion.span>
            <motion.span
              className="absolute -top-2 -right-2 text-pink-400 text-lg"
              animate={{ scale: [0, 1, 0], rotate: [0, -180] }}
              transition={{ repeat: Infinity, duration: 1, repeatDelay: 0.7 }}
            >
              ✦
            </motion.span>
          </>
        )}
      </motion.div>

      {/* Speech bubble */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative bg-card border-2 border-foreground/20 rounded-2xl px-4 py-2 shadow-lg max-w-[200px]"
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-l-2 border-t-2 border-foreground/20 rotate-45" />
          <p className="text-sm text-foreground text-center font-body">{message}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CartoonBunny;
