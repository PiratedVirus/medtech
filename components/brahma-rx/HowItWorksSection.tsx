import { CheckCircle2 } from 'lucide-react';
const STEPS = [{
  number: '01',
  title: 'Set Up Your Profile',
  description: 'Register your clinic or hospital. Configure your specialty modules and team roles in minutes.'
}, {
  number: '02',
  title: 'Add Patient Data',
  description: 'Use AI Voice Scribe to dictate notes or AI SCAN to upload lab reports. Data is automatically structured.'
}, {
  number: '03',
  title: 'Review Horizontal Snapshots',
  description: 'View 10 minutes of patient history in ~10 seconds with our longitudinal timeline view.'
}, {
  number: '04',
  title: 'Get AI-Powered Insights',
  description: 'Receive patient-specific clinical guidance. You stay in control—the AI assists, you decide.'
}, {
  number: '05',
  title: 'Generate & Export',
  description: 'Create e-prescriptions with 1-tap verify. Export structured data for research and quality improvement.'
}];
export const HowItWorksSection = () => {
  return <section id="how-it-works" className="relative py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-6 text-gradient-brand">
          How It Works
        </h2>
        <p className="text-lg text-center mb-16 max-w-2xl mx-auto text-white">
          Get started with BrahmaRx AI in 5 simple steps
        </p>

        <div className="space-y-8">
          {STEPS.map((step, index) => <div key={index} className="glass-card p-8 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] rounded-md">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 border border-primary/30 flex items-center justify-center">
                    <span className="text-2xl font-display font-bold text-gradient-brand">
                      {step.number}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-display text-foreground font-bold text-xl">
                      {step.title}
                    </h3>
                    <CheckCircle2 className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-foreground/70 leading-relaxed text-base">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </section>;
};