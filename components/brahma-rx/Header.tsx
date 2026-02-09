import { FibonacciLotus } from './FibonacciLotus';
import { Button } from '@/components/ui/button';
const logo = '/brahma-rx-assets/logo.png';
export const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  return <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30">
      <nav className="container mx-auto px-4 py-0">
        <div className="flex items-center justify-between py-0">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <img src={logo} alt="BrahmaRx AI Logo" className="w-12 h-12 md:w-14 md:h-14" />
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient-brand">
                BrahmaRx AI
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block">
                an AIIMS, New Delhi Alumnus Venture
              </p>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <button onClick={() => scrollToSection('hero')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Home
            </button>
            <button onClick={() => scrollToSection('about')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              About Us
            </button>
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Core Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              How It Works
            </button>
          </div>

          {/* CTA */}
          <a href="mailto:aurangeabhinav777@gmail.com?subject=Book%20a%20Demo%20-%20BrahmaRx%20AI" className="hidden md:block">
            <Button variant="gradient" size="lg">
              Book a Demo
            </Button>
          </a>
        </div>
      </nav>
    </header>;
};