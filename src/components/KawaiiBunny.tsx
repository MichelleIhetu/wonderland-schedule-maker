import { motion } from "framer-motion";

interface KawaiiBunnyProps {
  mood?: "happy" | "encouraging" | "celebrating" | "focused";
  size?: "sm" | "md" | "lg";
  message?: string;
}

const KawaiiBunny = ({ mood = "happy", size = "md", message }: KawaiiBunnyProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32",
  };

  const eyeExpressions = {
    happy: "◕‿◕",
    encouraging: "◕ω◕",
    celebrating: "★‿★",
    focused: "◕_◕",
  };

  const blushColors = {
    happy: "bg-pink-300",
    encouraging: "bg-pink-400",
    celebrating: "bg-yellow-300",
    focused: "bg-pink-200",
  };

  return (
    <motion.div 
      className="flex flex-col items-center gap-2"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <motion.div
        className="relative"
        animate={{ 
          y: [0, -5, 0],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2,
          ease: "easeInOut"
        }}
      >
        {/* Bunny ears */}
        <div className="flex gap-1 justify-center -mb-3 relative z-10">
          <motion.div 
            className="w-6 h-14 bg-gradient-to-t from-pink-100 to-white rounded-full shadow-md border-2 border-pink-200"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <div className="w-3 h-8 bg-pink-200 rounded-full mx-auto mt-3" />
          </motion.div>
          <motion.div 
            className="w-6 h-14 bg-gradient-to-t from-pink-100 to-white rounded-full shadow-md border-2 border-pink-200"
            animate={{ rotate: [5, -5, 5] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
          >
            <div className="w-3 h-8 bg-pink-200 rounded-full mx-auto mt-3" />
          </motion.div>
        </div>
        
        {/* Bunny head/body - kawaii round shape */}
        <div className={`${sizeClasses[size]} relative bg-gradient-to-b from-white to-pink-50 rounded-full shadow-lg border-2 border-pink-200`}>
          {/* Eyes - big kawaii style */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex gap-4">
            <motion.div 
              className="relative"
              animate={mood === "happy" ? { scaleY: [1, 0.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
            >
              <div className="w-4 h-5 bg-gray-900 rounded-full">
                <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1 left-0.5" />
              </div>
            </motion.div>
            <motion.div 
              className="relative"
              animate={mood === "happy" ? { scaleY: [1, 0.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
            >
              <div className="w-4 h-5 bg-gray-900 rounded-full">
                <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1 left-0.5" />
              </div>
            </motion.div>
          </div>
          
          {/* Blush marks */}
          <div className="absolute top-1/2 left-2 w-3 h-2 rounded-full opacity-60" style={{ backgroundColor: '#fda4af' }} />
          <div className="absolute top-1/2 right-2 w-3 h-2 rounded-full opacity-60" style={{ backgroundColor: '#fda4af' }} />
          
          {/* Cute nose */}
          <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2">
            <div className="w-2.5 h-2 bg-pink-400 rounded-full" />
          </div>
          
          {/* Mouth */}
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2">
            {mood === "happy" || mood === "celebrating" ? (
              <div className="text-pink-500 text-xs font-bold">ω</div>
            ) : (
              <div className="w-3 h-1.5 border-b-2 border-pink-400 rounded-b-full" />
            )}
          </div>

          {/* Little paws at bottom */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-4 h-3 bg-white rounded-full border border-pink-200 shadow-sm" />
            <div className="w-4 h-3 bg-white rounded-full border border-pink-200 shadow-sm" />
          </div>
        </div>

        {/* Sparkles for celebrating mood */}
        {mood === "celebrating" && (
          <>
            <motion.div
              className="absolute -top-2 -left-2 text-yellow-400"
              animate={{ scale: [0, 1, 0], rotate: [0, 180] }}
              transition={{ repeat: Infinity, duration: 1, repeatDelay: 0.5 }}
            >
              ✦
            </motion.div>
            <motion.div
              className="absolute -top-2 -right-2 text-pink-400"
              animate={{ scale: [0, 1, 0], rotate: [0, -180] }}
              transition={{ repeat: Infinity, duration: 1, repeatDelay: 0.7 }}
            >
              ✦
            </motion.div>
            <motion.div
              className="absolute top-1/2 -right-4 text-primary"
              animate={{ scale: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, repeatDelay: 0.3 }}
            >
              ♡
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Speech bubble with message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white border-2 border-pink-200 rounded-2xl px-4 py-2 shadow-md max-w-[200px]"
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l-2 border-t-2 border-pink-200 rotate-45" />
          <p className="text-sm text-gray-700 text-center font-body">{message}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default KawaiiBunny;
