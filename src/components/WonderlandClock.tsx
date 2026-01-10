import { useEffect, useState } from "react";

const WonderlandClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = (hours * 30) + (minutes * 0.5);
  const minuteDeg = minutes * 6;
  const secondDeg = seconds * 6;

  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Clock face */}
      <div className="absolute inset-0 rounded-full border-4 border-wonderland-gold bg-card shadow-float">
        {/* Decorative inner ring */}
        <div className="absolute inset-3 rounded-full border-2 border-secondary/50" />
        
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-3 bg-wonderland-gold rounded-full"
            style={{
              left: "50%",
              top: "8px",
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
              transformOrigin: "50% 88px",
            }}
          />
        ))}

        {/* Roman numerals for key hours */}
        <span className="absolute top-6 left-1/2 -translate-x-1/2 font-display text-xs text-foreground">XII</span>
        <span className="absolute right-6 top-1/2 -translate-y-1/2 font-display text-xs text-foreground">III</span>
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-display text-xs text-foreground">VI</span>
        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-display text-xs text-foreground">IX</span>

        {/* Hour hand */}
        <div
          className="absolute w-1.5 h-12 bg-wonderland-teal rounded-full origin-bottom transition-transform"
          style={{
            left: "50%",
            bottom: "50%",
            transform: `translateX(-50%) rotate(${hourDeg}deg)`,
          }}
        />

        {/* Minute hand */}
        <div
          className="absolute w-1 h-16 bg-foreground rounded-full origin-bottom transition-transform"
          style={{
            left: "50%",
            bottom: "50%",
            transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
          }}
        />

        {/* Second hand */}
        <div
          className="absolute w-0.5 h-18 bg-wonderland-rose rounded-full origin-bottom"
          style={{
            left: "50%",
            bottom: "50%",
            height: "72px",
            transform: `translateX(-50%) rotate(${secondDeg}deg)`,
          }}
        />

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-wonderland-gold shadow-card" />
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-6 bg-wonderland-gold rounded-t-full" />
    </div>
  );
};

export default WonderlandClock;
