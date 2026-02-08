import { StethoscopeIcon, HeartPulseIcon, BrainIcon } from './icons/PremiumIcons';
const MODULES = [{
  name: 'Endocrinology',
  status: 'LIVE',
  angle: 0
}, {
  name: 'Nephrology',
  status: 'Coming Soon',
  angle: 60
}, {
  name: 'Rheumatology',
  status: 'Coming Soon',
  angle: 120
}, {
  name: 'Cardiology',
  status: 'Coming Soon',
  angle: 180
}, {
  name: 'Dermatology',
  status: 'Coming Soon',
  angle: 240
}, {
  name: 'Pediatrics',
  status: 'Coming Soon',
  angle: 300
}];
export const OrbitingModules = () => {
  const radius = 140; // orbit radius in pixels for mobile, will scale up for desktop

  return <section className="relative py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-5xl font-display text-center mb-6 md:mb-8 text-gradient-brand font-bold py-[10px] lg:text-6xl">
          Central Intelligence
        </h2>
        <p className="text-center text-sm max-w-2xl mx-auto mb-12 md:mb-16 px-4 text-orange-100 md:text-base">As Brahma created the universe from a single source, BrahmaRx AI serves as the luminous core, energizing and harmonizing every specialty EMR through one intelligent ecosystem.</p>

        {/* Orbit Visualization */}
        <div className="relative w-full max-w-2xl mx-auto aspect-square flex items-center justify-center mb-6 md:mb-10">
          {/* Central Core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-gold opacity-30 blur-3xl rounded-full animate-pulse" />
              <div className="absolute inset-0 bg-gold/20 rounded-full blur-2xl animate-pulse" style={{
              animationDelay: '0.5s'
            }} />
              <div className="relative glass-card border-2 border-gold/60 px-4 md:px-8 py-4 md:py-6 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] transition-all duration-300">
                <BrainIcon className="w-8 md:w-12 h-8 md:h-12 text-gold mx-auto mb-2 md:mb-3" />
                <h3 className="text-lg md:text-2xl font-display font-bold text-gradient-brand whitespace-nowrap">
                  BrahmaRx AI
                </h3>
                <p className="text-xs text-muted-foreground mt-1 hidden md:block">Central Intelligence</p>
              </div>
            </div>
          </div>

          {/* Orbit Circle */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r={radius} fill="none" stroke="hsl(var(--primary) / 0.2)" strokeWidth="2" strokeDasharray="8 8" />
          </svg>

          {/* Orbiting Modules */}
          {MODULES.map((module, index) => {
          const angleRad = module.angle * Math.PI / 180;
          const x = 200 + radius * Math.cos(angleRad);
          const y = 200 + radius * Math.sin(angleRad);
          const isLive = module.status === 'LIVE';
          return <div key={index} className="absolute" style={{
            left: `${x / 400 * 100}%`,
            top: `${y / 400 * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}>
                <div className={`glass-card px-1.5 md:px-3 py-1.5 md:py-2 rounded-lg border ${isLive ? 'border-gold/60 bg-gold/10 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:scale-105' : 'border-muted/40 bg-muted/5 hover:scale-105'} transition-all duration-300 cursor-pointer min-w-[70px] md:min-w-[110px] text-center`}>
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <StethoscopeIcon className={`w-2.5 md:w-3.5 h-2.5 md:h-3.5 ${isLive ? 'text-gold' : 'text-muted-foreground'}`} />
                    <h4 className={`text-[9px] md:text-xs font-semibold ${isLive ? 'text-gold' : 'text-foreground/70'}`}>
                      {module.name}
                    </h4>
                  </div>
                  <span className={`text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded-full ${isLive ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-muted/20 text-muted-foreground border border-muted/30'}`}>
                    {module.status}
                  </span>
                </div>
              </div>;
        })}
        </div>
      </div>
    </section>;
};