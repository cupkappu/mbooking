import { Header } from '@/components/home/header';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturesSection } from '@/components/home/features-section';
import { Footer } from '@/components/home/footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={false} userName={null} />
      <main>
        <HeroSection isAuthenticated={false} />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
