import { useEffect, useState } from 'react';
import { TimelineIcon, LayersIcon, MicrophoneIcon, ScanIcon, GraduationCapIcon } from './icons/PremiumIcons';
import { Badge } from '@/components/ui/badge';
const logo = '/brahma-rx-assets/logo.png';
const USP_BADGES = [{
  icon: LayersIcon,
  text: 'Horizontal Snapshots',
  delay: 0
}, {
  icon: MicrophoneIcon,
  text: 'AI Voice Scribe',
  delay: 150
}, {
  icon: ScanIcon,
  text: 'AI SCAN to Data',
  delay: 300
}];
export const HeroSection = () => {
  const [visible, setVisible] = useState(false);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  useEffect(() => {
    setVisible(true);
  }, []);
  return <section id="hero" className="relative min-h-screen flex items-center justify-center pt-24 md:pt-32 pb-16 px-4">
      <div className="container mx-auto max-w-5xl text-center">
        {/* Brand Title */}
        <h1 className={`text-6xl md:text-7xl lg:text-8xl font-display font-bold text-gradient-brand mb-6 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{
        transitionDelay: '0ms'
      }}>
          BrahmaRx AI
        </h1>

        {/* Logo */}
        <div className={`flex justify-center mb-6 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{
        transitionDelay: '50ms'
      }}>
          <img 
            src={logo} 
            alt="BrahmaRx AI Logo" 
            className="w-36 h-36 md:w-48 md:h-48 animate-pulse drop-shadow-[0_0_30px_rgba(234,179,8,0.6)] cursor-pointer" 
            onClick={() => scrollToSection('hero')}
          />
        </div>

        {/* Tagline */}
        <p className={`text-lg md:text-xl font-display font-semibold text-foreground mb-6 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{
        transitionDelay: '100ms'
      }}>
Creator of Central Intelligence Based EHR
      </p>

        {/* Tagline Badges */}
        <div className="flex flex-col gap-3 mb-8">
          <Badge className={`mx-auto px-4 py-2 text-xs md:text-sm bg-gold/20 text-gold border border-gold/50 backdrop-blur-sm shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{
          transitionDelay: '200ms'
        }}>
            <GraduationCapIcon className="w-4 h-4 mr-2" />
            an AIIMS, New Delhi Alumnus Venture
          </Badge>
          
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-display font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{
          transitionDelay: '300ms'
        }}>Create Order from Clinical Chaos
        </h2>
        </div>

        {/* Main Value Prop */}
        <p className={`text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-12 leading-relaxed transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{
        transitionDelay: '400ms'
      }}>
          BrahmaRx AI is the central, AI-enabled EHR that structures data, scribes your notes,
          scans reports, and powers specialty modules—so clinicians spend{' '}
          <span className="text-gradient-brand font-bold text-xl md:text-2xl animate-pulse block">
less time clicking</span>{' '}
          <span className="text-gradient-brand font-bold text-xl md:text-2xl animate-pulse block" style={{
          animationDelay: '0.5s'
        }}>more time caring</span>.
        </p>

        {/* USP Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10">
          {USP_BADGES.map((badge, index) => {
          const Icon = badge.icon;
          return <button key={index} onClick={() => scrollToSection('features')} className={`glass-card px-4 md:px-6 py-2 md:py-3 rounded-full flex items-center gap-2 md:gap-3 glow-primary hover:scale-105 transition-all duration-500 animate-float-subtle cursor-pointer ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{
            transitionDelay: `${550 + badge.delay}ms`,
            animationDelay: `${badge.delay}ms`
          }}>
                <Icon className="w-4 md:w-5 h-4 md:h-5 text-gold" strokeWidth={2} />
                <span className="text-xs md:text-sm font-medium text-foreground">{badge.text}</span>
              </button>;
        })}
        </div>

        {/* Doctor-for-Doctors Badge */}
        <Badge variant="outline" className={`px-8 py-3 text-base border-primary/60 bg-primary/10 text-primary backdrop-blur-sm glow-primary transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{
        transitionDelay: '1000ms'
      }}>
          Made by a Doctor for Doctors
        </Badge>
      </div>
    </section>;
};