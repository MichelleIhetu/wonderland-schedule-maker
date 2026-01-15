import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const BunnyClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = hours * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6;
  const secondDeg = seconds * 6;

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className="relative"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      >
        {/* SVG Looney Tunes Style Bunny */}
        <svg width="120" height="140" viewBox="0 0 120 140" className="drop-shadow-lg">
          {/* Ears */}
          <motion.ellipse
            cx="35"
            cy="25"
            rx="12"
            ry="30"
            fill="#f5f5f5"
            stroke="#2d2d2d"
            strokeWidth="3"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ transformOrigin: "35px 55px" }}
          />
          <ellipse cx="35" cy="25" rx="6" ry="20" fill="#ffb6c1" />
          
          <motion.ellipse
            cx="85"
            cy="25"
            rx="12"
            ry="30"
            fill="#f5f5f5"
            stroke="#2d2d2d"
            strokeWidth="3"
            animate={{ rotate: [5, -5, 5] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 }}
            style={{ transformOrigin: "85px 55px" }}
          />
          <ellipse cx="85" cy="25" rx="6" ry="20" fill="#ffb6c1" />
          
          {/* Head */}
          <ellipse cx="60" cy="75" rx="40" ry="35" fill="#f5f5f5" stroke="#2d2d2d" strokeWidth="3" />
          
          {/* Cheeks */}
          <ellipse cx="30" cy="80" rx="12" ry="10" fill="#f5f5f5" stroke="#2d2d2d" strokeWidth="2" />
          <ellipse cx="90" cy="80" rx="12" ry="10" fill="#f5f5f5" stroke="#2d2d2d" strokeWidth="2" />
          
          {/* Eyes - Classic cartoon style */}
          <ellipse cx="45" cy="68" rx="10" ry="12" fill="white" stroke="#2d2d2d" strokeWidth="2" />
          <ellipse cx="75" cy="68" rx="10" ry="12" fill="white" stroke="#2d2d2d" strokeWidth="2" />
          
          {/* Pupils */}
          <motion.g
            animate={{ x: [0, 2, 0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <circle cx="47" cy="70" r="5" fill="#2d2d2d" />
            <circle cx="77" cy="70" r="5" fill="#2d2d2d" />
            {/* Eye shine */}
            <circle cx="49" cy="68" r="2" fill="white" />
            <circle cx="79" cy="68" r="2" fill="white" />
          </motion.g>
          
          {/* Eyebrows */}
          <path d="M35 55 Q45 50 55 55" fill="none" stroke="#2d2d2d" strokeWidth="2" strokeLinecap="round" />
          <path d="M65 55 Q75 50 85 55" fill="none" stroke="#2d2d2d" strokeWidth="2" strokeLinecap="round" />
          
          {/* Nose */}
          <ellipse cx="60" cy="85" rx="6" ry="4" fill="#ffb6c1" stroke="#2d2d2d" strokeWidth="2" />
          
          {/* Mouth - Big cartoon smile */}
          <path d="M45 92 Q60 105 75 92" fill="none" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Buck teeth */}
          <rect x="54" y="92" width="6" height="8" rx="1" fill="white" stroke="#2d2d2d" strokeWidth="1.5" />
          <rect x="60" y="92" width="6" height="8" rx="1" fill="white" stroke="#2d2d2d" strokeWidth="1.5" />
          
          {/* Body */}
          <ellipse cx="60" cy="120" rx="25" ry="18" fill="#f5f5f5" stroke="#2d2d2d" strokeWidth="3" />
          
          {/* Arms with white gloves */}
          <motion.g
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{ transformOrigin: "35px 115px" }}
          >
            <path d="M35 115 Q20 120 15 130" fill="none" stroke="#2d2d2d" strokeWidth="6" strokeLinecap="round" />
            <circle cx="15" cy="132" r="8" fill="white" stroke="#2d2d2d" strokeWidth="2" />
          </motion.g>
          
          <motion.g
            animate={{ rotate: [5, -5, 5] }}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{ transformOrigin: "85px 115px" }}
          >
            <path d="M85 115 Q100 120 105 130" fill="none" stroke="#2d2d2d" strokeWidth="6" strokeLinecap="round" />
            <circle cx="105" cy="132" r="8" fill="white" stroke="#2d2d2d" strokeWidth="2" />
          </motion.g>
        </svg>

        {/* Pocket watch held by bunny */}
        <motion.div 
          className="absolute -bottom-16 left-1/2 -translate-x-1/2"
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{ transformOrigin: "top center" }}
        >
          {/* Chain */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-5 bg-yellow-500 rounded-full" />
          
          {/* Watch face */}
          <div className="w-16 h-16 rounded-full border-4 border-yellow-500 bg-card shadow-lg relative">
            <div className="absolute inset-1 rounded-full border-2 border-primary/30" />
            
            {/* Hour markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-1.5 bg-yellow-600 rounded-full"
                style={{
                  left: "50%",
                  top: "4px",
                  transform: `translateX(-50%) rotate(${i * 30}deg)`,
                  transformOrigin: "50% 28px",
                }}
              />
            ))}

            {/* Hour hand */}
            <div
              className="absolute w-1 h-4 bg-primary rounded-full origin-bottom"
              style={{
                left: "50%",
                bottom: "50%",
                transform: `translateX(-50%) rotate(${hourDeg}deg)`,
              }}
            />

            {/* Minute hand */}
            <div
              className="absolute w-0.5 h-5 bg-foreground rounded-full origin-bottom"
              style={{
                left: "50%",
                bottom: "50%",
                transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
              }}
            />

            {/* Second hand */}
            <div
              className="absolute bg-red-500 rounded-full origin-bottom"
              style={{
                left: "50%",
                bottom: "50%",
                width: "1px",
                height: "24px",
                transform: `translateX(-50%) rotate(${secondDeg}deg)`,
              }}
            />

            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500" />
          </div>
        </motion.div>
      </motion.div>
      
      {/* Time display */}
      <div className="mt-20 text-center">
        <p className="font-display text-lg text-primary">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs text-muted-foreground italic">
          "What's up, Doc? Don't be late!"
        </p>
      </div>
    </div>
  );
};

export default BunnyClock;