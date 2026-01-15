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
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        {/* Kawaii Bunny ears */}
        <div className="flex gap-1 justify-center -mb-2 relative z-10">
          <motion.div 
            className="w-5 h-12 bg-gradient-to-t from-pink-100 to-white rounded-full shadow-md border-2 border-pink-200"
            animate={{ rotate: [-3, 5, -3] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          >
            <div className="w-2.5 h-6 bg-pink-200 rounded-full mx-auto mt-2" />
          </motion.div>
          <motion.div 
            className="w-5 h-12 bg-gradient-to-t from-pink-100 to-white rounded-full shadow-md border-2 border-pink-200"
            animate={{ rotate: [3, -5, 3] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.15 }}
          >
            <div className="w-2.5 h-6 bg-pink-200 rounded-full mx-auto mt-2" />
          </motion.div>
        </div>
        
        {/* Kawaii Bunny head */}
        <div className="relative w-20 h-16 bg-gradient-to-b from-white to-pink-50 rounded-full shadow-lg border-2 border-pink-200">
          {/* Big kawaii eyes */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3">
            <motion.div 
              className="relative"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 2.5 }}
            >
              <div className="w-3.5 h-4 bg-gray-900 rounded-full">
                <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
              </div>
            </motion.div>
            <motion.div 
              className="relative"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 2.5 }}
            >
              <div className="w-3.5 h-4 bg-gray-900 rounded-full">
                <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
              </div>
            </motion.div>
          </div>
          
          {/* Blush marks */}
          <div className="absolute top-7 left-1.5 w-2.5 h-1.5 rounded-full opacity-60" style={{ backgroundColor: '#fda4af' }} />
          <div className="absolute top-7 right-1.5 w-2.5 h-1.5 rounded-full opacity-60" style={{ backgroundColor: '#fda4af' }} />
          
          {/* Cute nose */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-pink-400 rounded-full" />
          
          {/* Cute mouth */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-pink-500 text-[10px] font-bold">ω</div>
        </div>
        
        {/* Bunny body holding clock */}
        <div className="relative -mt-1 flex flex-col items-center">
          <div className="w-16 h-10 bg-gradient-to-b from-pink-50 to-white rounded-b-full border-2 border-t-0 border-pink-200" />
          
          {/* Paws holding clock */}
          <div className="absolute top-2 flex items-start">
            <div className="w-4 h-6 bg-white rounded-full border border-pink-200 transform rotate-12 -mr-1 z-10" />
            
            {/* Pocket watch */}
            <motion.div 
              className="relative w-14 h-14"
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{ transformOrigin: "top center" }}
            >
              {/* Chain */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-full" />
              
              {/* Clock face */}
              <div className="w-14 h-14 rounded-full border-3 border-yellow-400 bg-card shadow-lg">
                <div className="absolute inset-1 rounded-full border border-primary/20" />
                
                {/* Hour markers */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-1.5 bg-yellow-500 rounded-full"
                    style={{
                      left: "50%",
                      top: "3px",
                      transform: `translateX(-50%) rotate(${i * 30}deg)`,
                      transformOrigin: "50% 24px",
                    }}
                  />
                ))}

                {/* Hour hand */}
                <div
                  className="absolute w-0.5 h-3.5 bg-primary rounded-full origin-bottom"
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
                  className="absolute bg-pink-400 rounded-full origin-bottom"
                  style={{
                    left: "50%",
                    bottom: "50%",
                    width: "1px",
                    height: "22px",
                    transform: `translateX(-50%) rotate(${secondDeg}deg)`,
                  }}
                />

                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400" />
              </div>
            </motion.div>
            
            <div className="w-4 h-6 bg-white rounded-full border border-pink-200 transform -rotate-12 -ml-1 z-10" />
          </div>
        </div>
      </motion.div>
      
      {/* Time display */}
      <div className="mt-16 text-center">
        <p className="font-display text-lg text-primary">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs text-muted-foreground italic">
          "Don't be late~! ♡"
        </p>
      </div>
    </div>
  );
};

export default BunnyClock;