// Benefits Component

import { Rocket, Bell, Briefcase } from 'lucide-react';

export default function Benefits() {
  const benefits = [
    {
      icon: <Rocket className="w-8 h-8 text-blue-600" />,
      title: 'Launch Ready',
      description: 'Start receiving job alerts within minutes of signing up. No complex setup required.',
    },
    {
      icon: <Bell className="w-8 h-8 text-purple-600" />,
      title: 'No Missed Gigs',
      description: 'Get notified via email and Telegram the moment a matching job is posted.',
    },
    {
      icon: <Briefcase className="w-8 h-8 text-green-600" />,
      title: 'Freelancers Love This',
      description: 'Rated 5 stars by freelancers who landed clients faster than ever before.',
    },
  ];

  return (
    <section className="py-12 lg:py-15 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-7">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Why Freelancers Choose X Job Bot
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of freelancers who never miss an opportunity
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}