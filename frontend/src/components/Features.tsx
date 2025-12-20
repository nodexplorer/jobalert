// Features Component

import { Zap, Target, Rocket } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Zap className="w-9 h-9" />,
      title: 'Instant Alerts',
      description: 'Be the fastest to apply when new jobs drop on X.',
      gradient: 'from-yellow-400 to-orange-500',
    },
    {
      icon: <Target className="w-9 h-9" />,
      title: 'Jobs Tailored to You',
      description: 'Video editing gigs that match your skills & preferences.',
      gradient: 'from-blue-400 to-purple-500',
    },
    {
      icon: <Rocket className="w-9 h-9" />,
      title: 'More Opportunities',
      description: 'Land more freelance jobs and increase your income.',
      gradient: 'from-green-400 to-cyan-500',
    },
  ];

  return (
    <section className="py-8 lg:py-10 bg-white" id="features">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:shadow-2xl transition-shadow`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}