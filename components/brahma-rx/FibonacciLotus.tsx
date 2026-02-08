export const FibonacciLotus = () => {
  // Fibonacci/Golden Angle phyllotaxis pattern
  const goldenAngle = 137.5; // degrees
  const petalCount = 12;
  const petals = [];

  for (let i = 0; i < petalCount; i++) {
    const angle = (i * goldenAngle) % 360;
    const radius = Math.sqrt(i + 1) * 8;
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    
    petals.push({ x, y, angle, id: i });
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-20 h-20 md:w-24 md:h-24 animate-breathe"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lotusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.9" />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
          <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0.9" />
        </linearGradient>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer petals */}
      {petals.map((petal) => (
        <ellipse
          key={`outer-${petal.id}`}
          cx={petal.x}
          cy={petal.y}
          rx="4"
          ry="10"
          fill="none"
          stroke="url(#lotusGradient)"
          strokeWidth="1.2"
          transform={`rotate(${petal.angle} ${petal.x} ${petal.y})`}
          filter="url(#glow)"
        />
      ))}

      {/* Inner accents */}
      {petals.slice(0, 8).map((petal) => {
        const innerRadius = Math.sqrt(petal.id + 1) * 4;
        const innerX = 50 + innerRadius * Math.cos((petal.angle * Math.PI) / 180);
        const innerY = 50 + innerRadius * Math.sin((petal.angle * Math.PI) / 180);
        
        return (
          <ellipse
            key={`inner-${petal.id}`}
            cx={innerX}
            cy={innerY}
            rx="2.5"
            ry="6"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            transform={`rotate(${petal.angle} ${innerX} ${innerY})`}
            opacity="0.6"
          />
        );
      })}

      {/* Center core */}
      <circle
        cx="50"
        cy="50"
        r="3"
        fill="url(#lotusGradient)"
        filter="url(#glow)"
      />
    </svg>
  );
};
