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
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        {/* Classic Alice in Wonderland White Rabbit SVG */}
        <svg width="130" height="160" viewBox="0 0 130 160" className="drop-shadow-md">
          {/* Ears - tall and elegant */}
          <motion.g
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            style={{ transformOrigin: "45px 60px" }}
          >
            <ellipse cx="45" cy="30" rx="8" ry="28" fill="#faf8f5" stroke="#8b7355" strokeWidth="1.5" />
            <ellipse cx="45" cy="30" rx="4" ry="20" fill="#e8b4b8" opacity="0.6" />
          </motion.g>
          
          <motion.g
            animate={{ rotate: [2, -2, 2] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.2 }}
            style={{ transformOrigin: "85px 60px" }}
          >
            <ellipse cx="85" cy="30" rx="8" ry="28" fill="#faf8f5" stroke="#8b7355" strokeWidth="1.5" />
            <ellipse cx="85" cy="30" rx="4" ry="20" fill="#e8b4b8" opacity="0.6" />
          </motion.g>
          
          {/* Head - soft oval */}
          <ellipse cx="65" cy="72" rx="30" ry="26" fill="#faf8f5" stroke="#8b7355" strokeWidth="1.5" />
          
          {/* Gentle fur tufts on cheeks */}
          <path d="M38 75 Q32 78 36 82" fill="none" stroke="#d4c4b0" strokeWidth="1" opacity="0.5" />
          <path d="M92 75 Q98 78 94 82" fill="none" stroke="#d4c4b0" strokeWidth="1" opacity="0.5" />
          
          {/* Eyes - soft, slightly worried expression like the White Rabbit */}
          <ellipse cx="55" cy="68" rx="6" ry="7" fill="white" stroke="#8b7355" strokeWidth="1" />
          <ellipse cx="75" cy="68" rx="6" ry="7" fill="white" stroke="#8b7355" strokeWidth="1" />
          
          {/* Irises - warm brown */}
          <circle cx="56" cy="69" r="3.5" fill="#6b4423" />
          <circle cx="76" cy="69" r="3.5" fill="#6b4423" />
          
          {/* Pupils */}
          <circle cx="56.5" cy="69.5" r="1.5" fill="#2d1810" />
          <circle cx="76.5" cy="69.5" r="1.5" fill="#2d1810" />
          
          {/* Eye highlights */}
          <circle cx="54.5" cy="67.5" r="1" fill="white" opacity="0.8" />
          <circle cx="74.5" cy="67.5" r="1" fill="white" opacity="0.8" />
          
          {/* Eyebrows - slightly worried/hurried expression */}
          <path d="M48 60 Q55 58 62 61" fill="none" stroke="#a08060" strokeWidth="1" strokeLinecap="round" />
          <path d="M68 61 Q75 58 82 60" fill="none" stroke="#a08060" strokeWidth="1" strokeLinecap="round" />
          
          {/* Nose - small pink triangle */}
          <path d="M65 78 L62 83 L68 83 Z" fill="#e8a0a0" stroke="#c08080" strokeWidth="0.5" />
          
          {/* Mouth - gentle curve */}
          <path d="M58 86 Q65 90 72 86" fill="none" stroke="#a08060" strokeWidth="1" strokeLinecap="round" />
          
          {/* Whiskers - delicate */}
          <line x1="40" y1="80" x2="52" y2="78" stroke="#c4b4a0" strokeWidth="0.5" opacity="0.6" />
          <line x1="40" y1="83" x2="52" y2="82" stroke="#c4b4a0" strokeWidth="0.5" opacity="0.6" />
          <line x1="78" y1="78" x2="90" y2="80" stroke="#c4b4a0" strokeWidth="0.5" opacity="0.6" />
          <line x1="78" y1="82" x2="90" y2="83" stroke="#c4b4a0" strokeWidth="0.5" opacity="0.6" />
          
          {/* Body with waistcoat */}
          <ellipse cx="65" cy="115" rx="22" ry="20" fill="#faf8f5" stroke="#8b7355" strokeWidth="1.5" />
          
          {/* Red waistcoat */}
          <path d="M48 100 Q50 95 65 95 Q80 95 82 100 L80 130 Q65 135 50 130 Z" fill="#c94040" stroke="#8b2020" strokeWidth="1" />
          
          {/* Waistcoat buttons */}
          <circle cx="65" cy="108" r="2" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5" />
          <circle cx="65" cy="118" r="2" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5" />
          
          {/* White collar */}
          <path d="M52 98 Q58 102 65 100 Q72 102 78 98" fill="white" stroke="#d4c4b0" strokeWidth="0.5" />
          
          {/* Arms/Paws */}
          <ellipse cx="42" cy="120" rx="6" ry="8" fill="#faf8f5" stroke="#8b7355" strokeWidth="1" />
          <ellipse cx="88" cy="120" rx="6" ry="8" fill="#faf8f5" stroke="#8b7355" strokeWidth="1" />
        </svg>

        {/* Pocket watch */}
        <motion.div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          style={{ transformOrigin: "top center" }}
        >
          {/* Gold chain */}
          <svg width="60" height="70" viewBox="0 0 60 70" className="drop-shadow-sm">
            {/* Chain */}
            <path d="M30 0 Q25 10 30 15" fill="none" stroke="#d4a84b" strokeWidth="2" />
            
            {/* Watch case */}
            <circle cx="30" cy="42" r="24" fill="#f4e4bc" stroke="#d4a84b" strokeWidth="3" />
            <circle cx="30" cy="42" r="20" fill="#fffef8" stroke="#e8d4a8" strokeWidth="1" />
            
            {/* Hour markers */}
            {[...Array(12)].map((_, i) => (
              <line
                key={i}
                x1="30"
                y1="25"
                x2="30"
                y2={i % 3 === 0 ? "28" : "26"}
                stroke="#8b7355"
                strokeWidth={i % 3 === 0 ? "1.5" : "1"}
                transform={`rotate(${i * 30} 30 42)`}
              />
            ))}
            
            {/* Roman numerals for 12, 3, 6, 9 */}
            <text x="30" y="30" textAnchor="middle" fontSize="5" fill="#6b4423" fontFamily="serif">XII</text>
            <text x="46" y="44" textAnchor="middle" fontSize="5" fill="#6b4423" fontFamily="serif">III</text>
            <text x="30" y="58" textAnchor="middle" fontSize="5" fill="#6b4423" fontFamily="serif">VI</text>
            <text x="14" y="44" textAnchor="middle" fontSize="5" fill="#6b4423" fontFamily="serif">IX</text>
            
            {/* Hour hand */}
            <line
              x1="30"
              y1="42"
              x2="30"
              y2="32"
              stroke="#4a3520"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${hourDeg} 30 42)`}
            />
            
            {/* Minute hand */}
            <line
              x1="30"
              y1="42"
              x2="30"
              y2="28"
              stroke="#6b4423"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${minuteDeg} 30 42)`}
            />
            
            {/* Second hand */}
            <line
              x1="30"
              y1="42"
              x2="30"
              y2="26"
              stroke="#c94040"
              strokeWidth="0.75"
              strokeLinecap="round"
              transform={`rotate(${secondDeg} 30 42)`}
            />
            
            {/* Center pin */}
            <circle cx="30" cy="42" r="2" fill="#d4a84b" />
          </svg>
        </motion.div>
      </motion.div>
      
      {/* Time display */}
      <div className="mt-4 text-center">
        <p className="font-display text-lg text-primary">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs text-muted-foreground italic font-body">
          "Oh my ears and whiskers, how late it's getting!"
        </p>
      </div>
    </div>
  );
};

export default BunnyClock;