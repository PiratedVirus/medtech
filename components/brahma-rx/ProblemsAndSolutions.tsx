import { TimelineIcon, ScanIcon, MicrophoneIcon, BrainIcon } from './icons/PremiumIcons';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
const PROBLEMS = [{
  icon: TimelineIcon,
  title: 'Time Sink',
  description: 'Chart review takes ~10 minutes for each follow-up visit.'
}, {
  icon: ScanIcon,
  title: 'Unstructured Files',
  description: 'Reports live as images/PDFs; parameters cannot be analyzed.'
}, {
  icon: MicrophoneIcon,
  title: 'Typing Burden',
  description: 'Doctors dislike typing; digitalization stays unused.'
}, {
  icon: BrainIcon,
  title: 'Insights Delayed',
  description: 'Hard to spot trends at the point of care.'
}];
const SOLUTIONS = [{
  icon: TimelineIcon,
  title: 'Horizontal Snapshots',
  description: '~10 second review of meds, labs, vitals, and notes.'
}, {
  icon: ScanIcon,
  title: 'AI SCAN to Data',
  description: 'OCR++ to clean numeric parameters (unit-aware).'
}, {
  icon: MicrophoneIcon,
  title: 'AI Voice Scribe',
  description: 'Dictate to structured e-prescriptions; 1-tap verify & sign.'
}, {
  icon: BrainIcon,
  title: 'Precision Insights',
  description: 'Patient-specific guidance; doctor in the loop.'
}];
export const ProblemsAndSolutions = () => {
  return <section className="relative py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-3xl lg:text-5xl font-display font-bold text-center mb-12 md:mb-16 text-gradient-brand md:text-5xl">
          Problems → Solutions
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
          {/* Problems Column */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6 flex items-center gap-2">
              <span className="w-3 h-3 bg-destructive rounded-full" />
              Challenges
            </h3>
            {PROBLEMS.map((problem, index) => {
            const Icon = problem.icon;
            return <Card key={index} className="glass-card border-destructive/20 hover:border-destructive/40 transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <Icon className="w-6 h-6 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{problem.title}</CardTitle>
                        <CardDescription className="text-foreground/70">
                          {problem.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>;
          })}
          </div>

          {/* Solutions Column */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6 flex items-center gap-2">
              <span className="w-3 h-3 bg-gold rounded-full" />
              Solutions
            </h3>
            {SOLUTIONS.map((solution, index) => {
            const Icon = solution.icon;
            return <Card key={index} className="glass-card border-gold/20 hover:border-gold/40 transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-gold/10 border border-gold/20">
                        <Icon className="w-6 h-6 text-gold" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{solution.title}</CardTitle>
                        <CardDescription className="text-foreground/70">
                          {solution.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>;
          })}
          </div>
        </div>
      </div>
    </section>;
};