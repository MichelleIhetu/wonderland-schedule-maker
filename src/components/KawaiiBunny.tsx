import { motion } from "framer-motion";

interface CartoonBunnyProps {
  mood?: "happy" | "encouraging" | "celebrating" | "focused";
  size?: "sm" | "md" | "lg";
  message?: string;
}

const CartoonBunny = ({ mood = "happy", size = "md", message }: CartoonBunnyProps) => {
  const sizeScale = {
    sm: 0.5,
    md: 0.7,
    lg: 0.9,
  };

  const scale = sizeScale[size];

  // Different expressions based on mood
  const getExpression = () => {
    switch (mood) {
      case "celebrating":
        return { eyesClosed: true, smile: "big" };
      case "focused":
        return { eyesClosed: false, smile: "small" };
      case "encouraging":
        return { eyesClosed: false, smile: "gentle" };
      default:
        return { eyesClosed: false, smile: "gentle" };
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
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        style={{ transform: `scale(${scale})` }}
      >
        <svg width="100" height="120" viewBox="0 0 100 120" className="drop-shadow-md">
          {/* Ears */}
          <motion.g
            animate={{ rotate: [-2, 3, -2] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ transformOrigin: "35px 45px" }}
          >
            <ellipse cx="35" cy="22" rx="7" ry="22" fill="#faf8f5" stroke="#8b7355" strokeWidth="1.2" />
            <ellipse cx="35" cy="22" rx="3.5" ry="15" fill="#e8b4b8" opacity="0.5" />
          </motion.g>
          
          <motion.g
            animate={{ rotate: [2, -3, 2] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.15 }}
            style={{ transformOrigin: "65px 45px" }}
          >
            <ellipse cx="65" cy="22" rx="7" ry="22" fill="#faf8f5" stroke="#8b7355" strokeWidth="1.2" />
            <ellipse cx="65" cy="22" rx="3.5" ry="15" fill="#e8b4b8" opacity="0.5" />
          </motion.g>
          
          {/* Head */}
          <ellipse cx="50" cy="58" rx="26" ry="22" fill="#faf8f5" stroke="#8b7355" strokeWidth="1.2" />
          
          {/* Cheek fluff */}
          <path d="M28 60 Q22 64 26 68" fill="none" stroke="#d4c4b0" strokeWidth="0.8" opacity="0.4" />
          <path d="M72 60 Q78 64 74 68" fill="none" stroke="#d4c4b0" strokeWidth="0.8" opacity="0.4" />
          
          {/* Eyes */}
          {expression.eyesClosed ? (
            <>
              <path d="M38 54 Q43 50 48 54" fill="none" stroke="#6b4423" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M52 54 Q57 50 62 54" fill="none" stroke="#6b4423" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="42" cy="54" rx="5" ry="6" fill="white" stroke="#8b7355" strokeWidth="0.8" />
              <ellipse cx="58" cy="54" rx="5" ry="6" fill="white" stroke="#8b7355" strokeWidth="0.8" />
              <circle cx="43" cy="55" r="2.5" fill="#6b4423" />
              <circle cx="59" cy="55" r="2.5" fill="#6b4423" />
              <circle cx="42" cy="53" r="0.8" fill="white" opacity="0.8" />
              <circle cx="58" cy="53" r="0.8" fill="white" opacity="0.8" />
            </>
          )}
          
          {/* Eyebrows */}
          <path d="M36 47 Q42 45 48 48" fill="none" stroke="#a08060" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M52 48 Q58 45 64 47" fill="none" stroke="#a08060" strokeWidth="0.8" strokeLinecap="round" />
          
          {/* Nose */}
          <path d="M50 64 L47 68 L53 68 Z" fill="#e8a0a0" stroke="#c08080" strokeWidth="0.4" />
          
          {/* Mouth */}
          {expression.smile === "big" ? (
            <path d="M42 72 Q50 80 58 72" fill="none" stroke="#a08060" strokeWidth="1" strokeLinecap="round" />
          ) : expression.smile === "small" ? (
            <path d="M46 72 Q50 74 54 72" fill="none" stroke="#a08060" strokeWidth="0.8" strokeLinecap="round" />
          ) : (
            <path d="M44 72 Q50 76 56 72" fill="none" stroke="#a08060" strokeWidth="0.8" strokeLinecap="round" />
          )}
          
          {/* Whiskers */}
          <line x1="30" y1="65" x2="40" y2="63" stroke="#c4b4a0" strokeWidth="0.4" opacity="0.5" />
          <line x1="30" y1="68" x2="40" y2="67" stroke="#c4b4a0" strokeWidth="0.4" opacity="0.5" />
          <line x1="60" y1="63" x2="70" y2="65" stroke="#c4b4a0" strokeWidth="0.4" opacity="0.5" />
          <line x1="60" y1="67" x2="70" y2="68" stroke="#c4b4a0" strokeWidth="0.4" opacity="0.5" />
          
          {/* Body with waistcoat */}
          <ellipse cx="50" cy="95" rx="18" ry="16" fill="#faf8f5" stroke="#8b7355" strokeWidth="1.2" />
          
          {/* Red waistcoat */}
          <path d="M36 82 Q38 78 50 78 Q62 78 64 82 L62 108 Q50 112 38 108 Z" fill="#c94040" stroke="#8b2020" strokeWidth="0.8" />
          
          {/* Buttons */}
          <circle cx="50" cy="88" r="1.5" fill="#ffd700" stroke="#b8860b" strokeWidth="0.4" />
          <circle cx="50" cy="96" r="1.5" fill="#ffd700" stroke="#b8860b" strokeWidth="0.4" />
          
          {/* Collar */}
          <path d="M40 80 Q45 83 50 81 Q55 83 60 80" fill="white" stroke="#d4c4b0" strokeWidth="0.4" />
          
          {/* Paws */}
          <ellipse cx="34" cy="98" rx="5" ry="6" fill="#faf8f5" stroke="#8b7355" strokeWidth="0.8" />
          <ellipse cx="66" cy="98" rx="5" ry="6" fill="#faf8f5" stroke="#8b7355" strokeWidth="0.8" />
        </svg>

        {/* Gentle sparkles for celebrating */}
        {mood === "celebrating" && (
          <>
            <motion.span
              className="absolute -top-1 left-0 text-yellow-400/70 text-sm"
              animate={{ opacity: [0, 1, 0], y: [-5, -10] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 0.5 }}
            >
              ✧
            </motion.span>
            <motion.span
              className="absolute -top-1 right-0 text-yellow-400/70 text-sm"
              animate={{ opacity: [0, 1, 0], y: [-5, -10] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 0.8 }}
            >
              ✧
            </motion.span>
          </>
        )}
      </motion.div>

      {/* Speech bubble - styled like a storybook */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#fffef8] border border-[#d4c4b0] rounded-xl px-4 py-2 shadow-sm max-w-[180px]"
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#fffef8] border-l border-t border-[#d4c4b0] rotate-45" />
          <p className="text-sm text-[#6b4423] text-center font-body italic">{message}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CartoonBunny;
