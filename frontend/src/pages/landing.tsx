// FILE: src/pages/LandingPage.tsx
import Navigation from '../components/Navigation';   
import Hero from '../components/Hero';
import Features from '../components/Features';
import Benefits from '../components/Benefits';
import CTA from '../components/CTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Features />
      <Benefits />
      <CTA />
    </div>
  );
}