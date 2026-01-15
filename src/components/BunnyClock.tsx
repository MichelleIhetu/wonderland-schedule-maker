import { useEffect, useState } from "react";

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
      {/* Bunny */}
      <div className="relative animate-bunny-hop">
        {/* Bunny ears */}
        <div className="flex gap-4 justify-center -mb-2">
          <div className="w-6 h-16 bg-gradient-to-t from-muted to-foreground/90 rounded-full transform -rotate-12 shadow-lg">
            <div className="w-3 h-10 bg-primary/30 rounded-full mx-auto mt-3" />
          </div>
          <div className="w-6 h-16 bg-gradient-to-t from-muted to-foreground/90 rounded-full transform rotate-12 shadow-lg">
            <div className="w-3 h-10 bg-primary/30 rounded-full mx-auto mt-3" />
          </div>
        </div>
        
        {/* Bunny head */}
        <div className="relative w-24 h-20 bg-gradient-to-b from-foreground/95 to-muted rounded-full shadow-glow">
          {/* Eyes */}
          <div className="absolute top-6 left-4 w-4 h-5 bg-background rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full mt-1 ml-1 animate-shimmer" />
          </div>
          <div className="absolute top-6 right-4 w-4 h-5 bg-background rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full mt-1 ml-1 animate-shimmer" />
          </div>
          
          {/* Nose */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-3 h-2 bg-primary/60 rounded-full" />
          
          {/* Whiskers */}
          <div className="absolute bottom-4 left-2 w-6 h-px bg-foreground/40 -rotate-12" />
          <div className="absolute bottom-5 left-1 w-5 h-px bg-foreground/40" />
          <div className="absolute bottom-4 right-2 w-6 h-px bg-foreground/40 rotate-12" />
          <div className="absolute bottom-5 right-1 w-5 h-px bg-foreground/40" />
        </div>
        
        {/* Bunny body (partial, holding clock) */}
        <div className="relative -mt-2 flex justify-center">
          <div className="w-20 h-12 bg-gradient-to-b from-muted to-secondary rounded-t-full" />
        </div>
        
        {/* Bunny paws holding clock */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-start">
          {/* Left paw */}
          <div className="w-5 h-8 bg-foreground/90 rounded-full transform rotate-12 -mr-1 z-10" />
          
          {/* Clock */}
          <div className="relative w-20 h-20 animate-clock-swing origin-top">
            {/* Clock chain */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-5 bg-gradient-to-b from-wonderland-gold to-wonderland-gold/60 rounded-full" />
            
            {/* Clock face */}
            <div className="w-20 h-20 rounded-full border-4 border-wonderland-gold bg-card shadow-glow">
              {/* Decorative inner ring */}
              <div className="absolute inset-2 rounded-full border-2 border-primary/30" />
              
              {/* Hour markers */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-2 bg-wonderland-gold rounded-full"
                  style={{
                    left: "50%",
                    top: "4px",
                    transform: `translateX(-50%) rotate(${i * 30}deg)`,
                    transformOrigin: "50% 36px",
                  }}
                />
              ))}

              {/* Roman numerals */}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 font-display text-[8px] text-foreground">XII</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 font-display text-[8px] text-foreground">III</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-display text-[8px] text-foreground">VI</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 font-display text-[8px] text-foreground">IX</span>

              {/* Hour hand */}
              <div
                className="absolute w-1 h-5 bg-wonderland-teal rounded-full origin-bottom transition-transform"
                style={{
                  left: "50%",
                  bottom: "50%",
                  transform: `translateX(-50%) rotate(${hourDeg}deg)`,
                }}
              />

              {/* Minute hand */}
              <div
                className="absolute w-0.5 h-7 bg-foreground rounded-full origin-bottom transition-transform"
                style={{
                  left: "50%",
                  bottom: "50%",
                  transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
                }}
              />

              {/* Second hand */}
              <div
                className="absolute w-px bg-primary rounded-full origin-bottom"
                style={{
                  left: "50%",
                  bottom: "50%",
                  height: "32px",
                  transform: `translateX(-50%) rotate(${secondDeg}deg)`,
                }}
              />

              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-wonderland-gold shadow-glow" />
            </div>
          </div>
          
          {/* Right paw */}
          <div className="w-5 h-8 bg-foreground/90 rounded-full transform -rotate-12 -ml-1 z-10" />
        </div>
      </div>
      
      {/* Time display */}
      <div className="mt-24 text-center">
        <p className="font-display text-lg text-primary">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs text-muted-foreground italic">
          "I'm late! I'm late!"
        </p>
      </div>
    </div>
  );
};

export default BunnyClock;