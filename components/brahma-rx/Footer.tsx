import { FibonacciLotus } from './FibonacciLotus';
const logo = '/brahma-rx-assets/logo.png';

export const Footer = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative border-t border-border/30 py-12 px-4 mt-24">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-3 gap-12 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="BrahmaRx AI Logo" className="w-12 h-12" />
              <h3 className="text-xl font-display font-bold text-gradient-brand">BrahmaRx AI</h3>
            </div>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Creating order from clinical chaos. AI-enabled EHR and clinical intelligence platform built by doctors,
              for doctors.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-sm text-foreground/60 hover:text-foreground transition-colors text-left"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm text-foreground/60 hover:text-foreground transition-colors text-left"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('modules')}
                className="text-sm text-foreground/60 hover:text-foreground transition-colors text-left"
              >
                Modules
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-sm text-foreground/60 hover:text-foreground transition-colors text-left"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-sm text-foreground/60 hover:text-foreground transition-colors text-left"
              >
                Contact
              </button>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Contact</h4>
            <div className="space-y-2 text-sm text-foreground/60">
              <p>
                <a
                  href="mailto:aurangeabhinav777@gmail.com"
                  className="hover:text-foreground transition-colors"
                >
                  aurangeabhinav777@gmail.com
                </a>
              </p>
              <p>
                <a
                  href="mailto:connect@carediabetics.com"
                  className="hover:text-foreground transition-colors"
                >
                  connect@carediabetics.com
                </a>
              </p>
              <p className="pt-2">
                <a
                  href="https://www.linkedin.com/in/drabhinavaurange?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BOr7iJ9EGTBGbSdWyKfRKjA%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  LinkedIn
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-foreground/50">
            <p>&copy; {new Date().getFullYear()} Padmaram Healthcare Pvt. Ltd. All rights reserved.</p>
            <p className="text-xs">
              Built by a Doctor for Doctors • AIIMS New Delhi Alumnus
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
