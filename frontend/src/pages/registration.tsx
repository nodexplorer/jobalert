import { useState } from 'react';
import { Mail, Send, Zap, CheckCircle2, Clock } from 'lucide-react';
import { AxiosError } from 'axios';
import { authAPI } from '../services/api';

type Step = 'registration' | 'onboarding' | 'success';
type AlertFrequency = 'instant' | '30mins' | 'hourly';

interface RegistrationData {
  email: string;
  password: string;
  preferences: string[];
}

interface OnboardingData {
  telegram: string;
  inAppNotifications: boolean;
  jobCategory: string;
  alertFrequency: AlertFrequency;
}

export default function JobAlertsApp() {
  const [currentStep, setCurrentStep] = useState<Step>('registration');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [registrationData] = useState<RegistrationData>({
    email: '',
    password: '',
    preferences: ['video-editing'],
  });

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    telegram: '',
    inAppNotifications: true,
    jobCategory: 'video-editing',
    alertFrequency: 'instant',
  });



  const handleOnboarding = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.onboarding(
        onboardingData.telegram || null,
        [onboardingData.jobCategory],
        onboardingData.alertFrequency,
        onboardingData.inAppNotifications
      );

      localStorage.setItem('user', JSON.stringify(response.data));
      setCurrentStep('success');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail: string }>;
      setError(error.response?.data?.detail || 'Onboarding failed');
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCategoryChange = (category: string) => {
    setOnboardingData(prev => ({ ...prev, jobCategory: category }));
  };

  const handleFrequencyChange = (frequency: AlertFrequency) => {
    setOnboardingData(prev => ({ ...prev, alertFrequency: frequency }));
  };

  const toggleInAppNotifications = () => {
    setOnboardingData(prev => ({
      ...prev,
      inAppNotifications: !prev.inAppNotifications,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Registration Page */}
      {currentStep === 'registration' && (
        <div className="w-full flex">
          {/* Left Side */}
          <div
            className="w-1/2 bg-cover bg-center relative flex items-center justify-center p-8"
            style={{ backgroundImage: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-600/20" />

            <div className="relative z-10 max-w-sm text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                Never miss a paid editing job again.
              </h1>

              <div className="flex items-center justify-center gap-2 mb-8 text-white/90">
                <Zap className="w-5 h-5" />
                <p>We scan X in real-time so you don't have to.</p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-1/2 bg-white p-12 flex items-center justify-center">
            <div className="max-w-md w-full">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h2>
              <p className="text-gray-600 mb-8">Create an account to start receiving job alerts</p>

              <button
                onClick={() => authAPI.loginWithTwitter()}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Connect with X (Twitter)
              </button>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>We need this to scan for personalized jobs.</p>
                <p className="mt-1">Read-only access. We can't post.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Screens */}
      {currentStep === 'onboarding' && (
        <div className="w-full flex">
          {/* Screen 1: Where to send alerts */}
          <div className="flex-1 bg-white p-12 flex items-center justify-center border-r border-gray-200">
            <div className="max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Where should we send your job alerts?
              </h2>
              <p className="text-gray-600 mb-8">
                Enter where we should send job alerts as soon as we find a match.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Email Display */}
              <div className="mb-6">
                <label className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <Mail className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">{registrationData.email}</div>
                    <span className="text-xs text-gray-500">Email (Primary)</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </label>
              </div>

              {/* Telegram Input */}
              <div className="mb-6">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition cursor-pointer">
                  <Send className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Your Telegram ID or @username"
                      value={onboardingData.telegram}
                      onChange={(e) =>
                        setOnboardingData(prev => ({ ...prev, telegram: e.target.value }))
                      }
                      className="w-full outline-none text-gray-900 placeholder-gray-400 bg-transparent"
                    />
                    <span className="text-xs text-gray-500">Telegram (Optional)</span>
                  </div>
                </label>
              </div>

              {/* In-App Notifications */}
              <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg mb-8">
                <span className="font-medium text-gray-900">In-App Notifications</span>
                <button
                  onClick={toggleInAppNotifications}
                  className={`w-12 h-7 rounded-full transition ${onboardingData.inAppNotifications ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition transform ${onboardingData.inAppNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              <button
                onClick={() => setCurrentStep('onboarding')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Screen 2: What do you do */}
          <div className="flex-1 bg-white p-12 flex items-center justify-center border-r border-gray-200">
            <div className="max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What do you do?
              </h2>
              <p className="text-gray-600 mb-8">
                We'll only show jobs that match your skills.
              </p>

              <div className="space-y-3">
                {[
                  { id: 'video-editing', label: 'Video Editing', icon: '🎬' },
                  { id: 'web-dev', label: 'Web Development', icon: '💻' },
                  { id: 'content-writing', label: 'Content Writing', icon: '✍️' },
                  { id: 'design', label: 'Design', icon: '🎨' },
                ].map(job => (
                  <button
                    key={job.id}
                    onClick={() => handleJobCategoryChange(job.id)}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${onboardingData.jobCategory === job.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{job.icon}</span>
                      <div className="font-semibold text-gray-900">{job.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Screen 3: Alert Frequency */}
          <div className="flex-1 bg-white p-12 flex items-center justify-center">
            <div className="max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                How fast do you want alerts?
              </h2>

              <div className="space-y-4 mb-8">
                {[
                  {
                    id: 'instant' as AlertFrequency,
                    label: 'Instant',
                    icon: CheckCircle2,
                    badge: '(recommended)',
                  },
                  {
                    id: '30mins' as AlertFrequency,
                    label: 'Every 30 mins',
                    icon: Clock,
                    badge: '',
                  },
                  {
                    id: 'hourly' as AlertFrequency,
                    label: 'Hourly',
                    icon: Clock,
                    badge: '',
                  },
                ].map(freq => {
                  const Icon = freq.icon;
                  return (
                    <button
                      key={freq.id}
                      onClick={() => handleFrequencyChange(freq.id)}
                      className={`w-full p-4 rounded-lg border-2 transition text-left ${onboardingData.alertFrequency === freq.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-gray-900">{freq.label}</span>
                          {freq.badge && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {freq.badge}
                            </span>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 transition ${onboardingData.alertFrequency === freq.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                            }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleOnboarding}
                disabled={loading}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Get Started!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Screen */}
      {currentStep === 'success' && (
        <div className="w-full flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">You're all set!</h1>
            <p className="text-gray-600 mb-8">
              We're now scanning X for job alerts — redirecting to dashboard...
            </p>
            <div className="animate-spin w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}