import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import FeatureMarquee from "@/components/landing/FeatureMarquee";
import DashboardPreview from "@/components/landing/DashboardPreview";
import HowItWorks from "@/components/landing/HowItWorks";
import TrustSecurity from "@/components/landing/TrustSecurity";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import ScrollProgress from "@/components/landing/ScrollProgress";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <ScrollProgress />
      <LandingNav />
      <HeroSection />
      <FeatureMarquee />
      <DashboardPreview />
      <HowItWorks />
      <TrustSecurity />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
