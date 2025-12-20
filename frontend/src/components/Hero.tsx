// Hero Component

import { Zap } from 'lucide-react';
import DemoCard from './DemoCard';

export default function Hero() {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center pt-20 pb-14 lg:pb-19">
      {/* Background Image */}
      <div className="absolute inset-0 z-10">
        <img 
          src="/background.png" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        {/* <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-600/90 to-cyan-500/90"></div> */}
      </div>

      {/* Animated Background Effects */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }}></div>
      </div>

      {/* Content - Centered */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="flex flex-col items-center text-center">
          {/* Hero Content */}
          <div className="max-w-5xl">
            <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Get paid <span className="text-teal-500">freelance gigs </span> in real-time.
            </h1>

            <div className="flex items-center justify-center gap-3 text-xl sm:text-2xl lg:text-2xl text-white/95 mb-4">
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
              <p className='text-gray-900'>
               <span className="font-bold text-teal-500"> Scanning X </span> for video editing, web dev & writing jobs 24/7 so you don't have to.
              </p>
            </div>
          </div>

          {/* Demo Card - Centered */}
          <div className="w-full flex justify-center max-w-4xl">
            <DemoCard />
          </div>
        </div>
      </div>
    </section>
  );
}