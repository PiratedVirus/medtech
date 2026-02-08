import { GraduationCapIcon, StethoscopeIcon } from './icons/PremiumIcons';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
export const AboutSection = () => {
  return <section id="about" className="relative py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16 text-gradient-brand">
          About BrahmaRx AI
        </h2>

        <div className="space-y-8">
          {/* About the Platform */}
          <Card className="glass-card border-primary/30">
            <CardHeader>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <StethoscopeIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-4">About BrahmaRx AI</CardTitle>
                  <div className="space-y-4 text-foreground/80 leading-relaxed">
                    <p>
                      BrahmaRx AI is a next-generation, AI-enabled Electronic Health Record (EHR) and clinical
                      intelligence platform built to create order from clinical chaos. Designed for the modern
                      clinician, it transforms fragmented medical data into structured, actionable intelligence—so
                      you can spend less time clicking and more time caring.
                    </p>
                    <p>
                      At its core lies the idea of <span className="text-gradient-brand font-semibold">Central Intelligence</span>—just
                      as Brahma, the creator, sits at the center of the universe, BrahmaRx AI sits at the center of
                      your healthcare ecosystem. It powers specialty-specific modules across nephrology, endocrinology,
                      cardiology, and more, linking them through one intelligent system.
                    </p>
                    <p>
                      Unlike traditional EMRs built for billing and compliance, BrahmaRx AI is designed for clinical
                      excellence. From dictation-to-prescription AI scribes to horizontal snapshot views and structured
                      CSV exports for research, every feature empowers clinicians to work smarter, not harder.
                    </p>
                    <p className="text-gradient-brand font-semibold">
                      Every line of code in BrahmaRx AI is driven by a doctor's empathy and an engineer's precision.
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Founder */}
          <Card className="glass-card border-gold/30 glow-gold">
            <CardHeader>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-gold/10 border border-gold/20">
                  <GraduationCapIcon className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">Founder</CardTitle>
                  <h3 className="text-xl font-display font-bold text-foreground mb-1">
                    Dr. Abhinav Ram Aurange, MBBS
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AIIMS, New Delhi • Founder & CEO, Padmaram Healthcare Pvt. Ltd.
                  </p>
                  <CardDescription className="text-foreground/80 leading-relaxed space-y-3">
                    <p>
                      Dr. Abhinav combines clinical expertise with deep entrepreneurial vision. A graduate of the
                      All India Institute of Medical Sciences (AIIMS), New Delhi, he founded Padmaram Healthcare to
                      bridge the gap between medical science and technology.
                    </p>
                    <p>His work spans AI-driven health records and predictive modeling. Through BrahmaRx AI, he aims to build the digital backbone of India's precision healthcare revolution, while <a href="https://www.carediabetics.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-gold transition-colors font-semibold">CareDiabetics</a> — his innovative health-tech platform — is redefining how diabetes care is delivered across India.</p>
                    <div className="pt-4 flex flex-wrap gap-4">
                      <a href="https://www.linkedin.com/in/drabhinavaurange?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BOr7iJ9EGTBGbSdWyKfRKjA%3D%3D" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:text-gold transition-colors">
                        <span className="font-semibold">LinkedIn Profile</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                      <a href="https://www.carediabetics.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:text-gold transition-colors">
                        <span className="font-semibold">CareDiabetics</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>;
};