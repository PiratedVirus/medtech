import { StethoscopeIcon, HeartPulseIcon, BrainIcon } from './icons/PremiumIcons';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
const MODULES_DATA = [{
  name: 'Endocrinology',
  icon: BrainIcon,
  description: 'Comprehensive diabetes, thyroid, and hormonal disorder management with AI-powered insights.',
  status: 'LIVE',
  color: 'gold'
}, {
  name: 'Nephrology',
  icon: StethoscopeIcon,
  description: 'Kidney disease tracking, dialysis management, and renal function monitoring.',
  status: 'Coming Soon',
  color: 'muted'
}, {
  name: 'Rheumatology',
  icon: StethoscopeIcon,
  description: 'Autoimmune and inflammatory condition tracking with longitudinal assessments.',
  status: 'Coming Soon',
  color: 'muted'
}, {
  name: 'Cardiology',
  icon: HeartPulseIcon,
  description: 'Cardiac risk stratification, vitals monitoring, and cardiovascular health analytics.',
  status: 'Coming Soon',
  color: 'muted'
}, {
  name: 'Dermatology',
  icon: StethoscopeIcon,
  description: 'Skin condition documentation with visual tracking and treatment response analysis.',
  status: 'Coming Soon',
  color: 'muted'
}, {
  name: 'Pediatrics',
  icon: StethoscopeIcon,
  description: 'Growth charts, vaccination tracking, and age-appropriate clinical decision support.',
  status: 'Coming Soon',
  color: 'muted'
}];
export const ModulesSection = () => {
  return <section id="modules" className="relative py-24 px-4">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 text-gradient-brand py-0">
          Specialty Modules
        </h2>
        <p className="text-center text-foreground/70 max-w-2xl mx-auto mb-16">
          BrahmaRx AI powers specialty-specific clinical workflows, all connected through central intelligence.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES_DATA.map((module, index) => {
          const Icon = module.icon;
          const isLive = module.status === 'LIVE';
          return <Card key={index} className={`glass-card ${isLive ? 'border-gold/40 hover:border-gold/60 glow-gold' : 'border-muted/30 hover:border-muted/50'} transition-all duration-300 hover:scale-105`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${isLive ? 'bg-gold/10 border border-gold/20' : 'bg-muted/10 border border-muted/20'}`}>
                      <Icon className={`w-6 h-6 ${isLive ? 'text-gold' : 'text-muted-foreground'}`} />
                    </div>
                    <Badge variant={isLive ? 'default' : 'outline'} className={isLive ? 'bg-gold/20 text-gold border-gold/40' : ''}>
                      {module.status}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-xl mb-2">{module.name}</CardTitle>
                  <CardDescription className="text-foreground/70 mb-4">
                    {module.description}
                  </CardDescription>

                  {isLive && <Button variant="gradient" className="w-full" size="sm" onClick={() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  contactSection.scrollIntoView({
                    behavior: 'smooth'
                  });
                }
              }}>
                      Explore {module.name} Module
                    </Button>}
                </CardHeader>
              </Card>;
        })}
        </div>
      </div>
    </section>;
};