const SpiderWebBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 gradient-spider" />
      
      {/* Main center web */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] animate-web-pulse"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Radial lines */}
        {[...Array(16)].map((_, i) => (
          <line
            key={`radial-${i}`}
            x1="200"
            y1="200"
            x2={200 + 200 * Math.cos((i * 22.5 * Math.PI) / 180)}
            y2={200 + 200 * Math.sin((i * 22.5 * Math.PI) / 180)}
            stroke="hsl(280 60% 60% / 0.2)"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Concentric spiral rings */}
        {[30, 60, 90, 120, 150, 180].map((radius, ringIndex) => (
          <path
            key={`ring-${ringIndex}`}
            d={[...Array(16)]
              .map((_, i) => {
                const angle = (i * 22.5 * Math.PI) / 180;
                const wobble = Math.sin(i * 0.5) * 3;
                const x = 200 + (radius + wobble) * Math.cos(angle);
                const y = 200 + (radius + wobble) * Math.sin(angle);
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ") + " Z"}
            stroke="hsl(280 60% 60% / 0.15)"
            strokeWidth="0.5"
            fill="none"
          />
        ))}
      </svg>

      {/* Corner webs */}
      <svg
        className="absolute -top-20 -left-20 w-80 h-80 opacity-20"
        viewBox="0 0 200 200"
        fill="none"
      >
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={200 * Math.cos((i * 11.25 * Math.PI) / 180)}
            y2={200 * Math.sin((i * 11.25 * Math.PI) / 180)}
            stroke="hsl(280 50% 50%)"
            strokeWidth="0.5"
          />
        ))}
        {[25, 50, 75, 100, 125].map((r, i) => (
          <path
            key={i}
            d={`M ${r} 0 Q ${r * 0.7} ${r * 0.7} 0 ${r}`}
            stroke="hsl(280 50% 50%)"
            strokeWidth="0.5"
            fill="none"
          />
        ))}
      </svg>

      <svg
        className="absolute -top-20 -right-20 w-80 h-80 opacity-20 rotate-90"
        viewBox="0 0 200 200"
        fill="none"
      >
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={200 * Math.cos((i * 11.25 * Math.PI) / 180)}
            y2={200 * Math.sin((i * 11.25 * Math.PI) / 180)}
            stroke="hsl(280 50% 50%)"
            strokeWidth="0.5"
          />
        ))}
        {[25, 50, 75, 100, 125].map((r, i) => (
          <path
            key={i}
            d={`M ${r} 0 Q ${r * 0.7} ${r * 0.7} 0 ${r}`}
            stroke="hsl(280 50% 50%)"
            strokeWidth="0.5"
            fill="none"
          />
        ))}
      </svg>

      <svg
        className="absolute -bottom-20 -left-20 w-80 h-80 opacity-20 -rotate-90"
        viewBox="0 0 200 200"
        fill="none"
      >
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={200 * Math.cos((i * 11.25 * Math.PI) / 180)}
            y2={200 * Math.sin((i * 11.25 * Math.PI) / 180)}
            stroke="hsl(280 50% 50%)"
            strokeWidth="0.5"
          />
        ))}
        {[25, 50, 75, 100, 125].map((r, i) => (
          <path
            key={i}
            d={`M ${r} 0 Q ${r * 0.7} ${r * 0.7} 0 ${r}`}
            stroke="hsl(280 50% 50%)"
            strokeWidth="0.5"
            fill="none"
          />
        ))}
      </svg>

      <svg
        className="absolute -bottom-20 -right-20 w-80 h-80 opacity-20 rotate-180"
        viewBox="0 0 200 200"
        fill="none"
      >
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={200 * Math.cos((i * 11.25 * Math.PI) / 180)}
            y2={200 * Math.sin((i * 11.25 * Math.PI) / 180)}
            stroke="hsl(280 50% 50%)"
            strokeWidth="0.5"
          />
        ))}
        {[25, 50, 75, 100, 125].map((r, i) => (
          <path
            key={i}
            d={`M ${r} 0 Q ${r * 0.7} ${r * 0.7} 0 ${r}`}
            stroke="hsl(280 50% 50%)"
            strokeWidth="0.5"
            fill="none"
          />
        ))}
      </svg>

      {/* Floating web strands */}
      <div className="absolute top-1/4 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-primary/20 to-transparent animate-shimmer" />
      <div className="absolute top-1/3 right-1/3 w-px h-24 bg-gradient-to-b from-transparent via-primary/15 to-transparent animate-shimmer" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-px h-40 bg-gradient-to-b from-transparent via-primary/20 to-transparent animate-shimmer" style={{ animationDelay: '1s' }} />
    </div>
  );
};

export default SpiderWebBackground;