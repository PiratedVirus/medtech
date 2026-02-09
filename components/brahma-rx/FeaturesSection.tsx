import { TimelineIcon, MicrophoneIcon, ScanIcon, DatabaseIcon, BrainIcon, MobileIcon, ChartIcon, StethoscopeIcon } from './icons/PremiumIcons';
const horizontalSnapshotsVideo = '/brahma-rx-assets/horizontal-snapshots-demo.mp4';
const voiceScribeVideo = '/brahma-rx-assets/voice-scribe.mp4';
const aiScanVideo = '/brahma-rx-assets/ai-scan-demo.mp4';
const digitalizeVideo = '/brahma-rx-assets/digitalize-demo.mp4';
const patientAppVideo = '/brahma-rx-assets/patient-app-demo.mp4';
const csvExportVideo = '/brahma-rx-assets/csv-export-demo.mp4';
const precisionInsightsVideo = '/brahma-rx-assets/precision-insights-demo.mp4';
const institutionalEcosystemImage = '/brahma-rx-assets/institutional-ecosystem.png';
const FEATURES = [{
  icon: TimelineIcon,
  title: 'Horizontal Snapshots',
  description: 'Longitudinal strip view compressing 10 minutes of chart review into ~10 seconds. See meds, labs, vitals, and notes in one glance.',
  image: horizontalSnapshotsVideo,
  imageOnRight: false
}, {
  icon: MicrophoneIcon,
  title: 'AI Voice Scribe',
  description: 'Dictate doctor-patient conversations and watch as BrahmaRx AI structures them into e-prescriptions and encounter notes. 1-tap verify & sign.',
  image: voiceScribeVideo,
  imageOnRight: true
}, {
  icon: ScanIcon,
  title: 'AI SCAN to Data',
  description: 'Upload lab reports as PDFs and watch AI extract unit-standardized parameters into a clean, analyzable data table.',
  image: aiScanVideo,
  imageOnRight: false
}, {
  icon: DatabaseIcon,
  title: 'We Don\'t Just Digitize, We Digitalize',
  description: 'Transform values into solid data points that power analytics, research, and predictive modeling—not just static images.',
  image: digitalizeVideo,
  imageOnRight: true
}, {
  icon: BrainIcon,
  title: 'Precision Insights (Doctor in the Loop)',
  description: 'Patient-specific clinical guidance powered by AI, always with you in control. The AI assists; you decide.',
  image: precisionInsightsVideo,
  imageOnRight: false
}, {
  icon: MobileIcon,
  title: 'Your Own Patient Facing App',
  description: 'Personalised results delivery, appointment reminders, and health education—all connected to your EHR ecosystem. Thus improving patient compliance and your visibility.',
  image: patientAppVideo,
  imageOnRight: true
}, {
  icon: ChartIcon,
  title: 'Export data in Excel/CSV for R&D',
  description: 'We go beyond record keeping; Unlike traditional EMRs, BrahmaRx AI empowers doctors to instantly export complete patient data in structured CSV or Excel formats — unlocking seamless research, AI analytics, and real-world clinical insights. Filter patient cohorts and export structured data for clinical research, audits, and quality improvement initiatives.',
  image: csvExportVideo,
  imageOnRight: false
}, {
  icon: StethoscopeIcon,
  title: 'Institutional Ecosystem (LIMS-lite)',
  description: 'We have separate specialised software for all institutional needs, including LIMS (laboratory management software), billing, and more. Role-based access, audit trails, dashboards, and multi-location support for clinics, hospitals, and research centers.',
  image: institutionalEcosystemImage,
  imageOnRight: true
}];
export const FeaturesSection = () => {
  return <section id="features" className="relative py-24 px-4">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16 text-gradient-brand">
          Core Features
        </h2>

        <div className="space-y-24">
          {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          const content = <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-gold/20 border border-primary/30">
                    <Icon className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                    {feature.title === 'We Don\'t Just Digitize, We Digitalize' ? (
                      <>
                        We Don't Just Digitize, We <span className="text-gradient-brand">Digitalize</span>
                      </>
                    ) : (
                      feature.title
                    )}
                  </h3>
                </div>
                <p className="text-lg text-foreground/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>;
          const imageContent = feature.image ? <div className="flex-1">
                {feature.image.endsWith('.mp4') ? (
                  <video 
                    src={feature.image} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-auto rounded-xl border border-primary/20 shadow-2xl hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <img src={feature.image} alt={feature.title} className="w-full h-auto rounded-xl border border-primary/20 shadow-2xl hover:scale-105 transition-transform duration-500" loading="lazy" />
                )}
              </div> : <div className="flex-1">
                
              </div>;
          return <div key={index} className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                {feature.imageOnRight ? <>
                    {content}
                    {imageContent}
                  </> : <>
                    {imageContent}
                    {content}
                  </>}
              </div>;
        })}
        </div>
      </div>
    </section>;
};