import { useState } from 'react';
import { Mail, Send, Zap, CheckCircle2, Clock, Check, Fingerprint, Shield } from 'lucide-react';

type Step = 'registration' | 'categories' | 'alerts' | 'frequency' | 'biometric' | 'success';
type AlertFrequency = 'instant' | '30mins' | 'hourly';

interface RegistrationData {
  email: string;
  password: string;
}

interface OnboardingData {
  telegram: string;
  inAppNotifications: boolean;
  jobCategories: string[];
  alertFrequency: AlertFrequency;
}

const jobCategories = [
  { id: 'video-editing', label: 'Video Editing', icon: '🎬' },
  { id: 'web-dev', label: 'Web Development', icon: '💻' },
  { id: 'content-writing', label: 'Content Writing', icon: '✍️' },
  { id: 'design', label: 'Graphic Design', icon: '🎨' },
  { id: 'motion-graphics', label: 'Motion Graphics', icon: '🎞️' },
];

export default function JobAlertsApp() {
  const [currentStep, setCurrentStep] = useState<Step>('registration');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const [registrationData] = useState<RegistrationData>({
    email: 'user@example.com',
    password: '',
  });

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    telegram: '',
    inAppNotifications: true,
    jobCategories: [],
    alertFrequency: 'instant',
  });

  // Mock Twitter login
  const handleTwitterLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentStep('categories');
    }, 1000);
  };

  const toggleCategory = (categoryId: string) => {
    setOnboardingData(prev => ({
      ...prev,
      jobCategories: prev.jobCategories.includes(categoryId)
        ? prev.jobCategories.filter(id => id !== categoryId)
        : [...prev.jobCategories, categoryId]
    }));
  };

  const handleContinueFromCategories = () => {
    if (onboardingData.jobCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }
    setError('');
    setCurrentStep('alerts');
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

  const handleContinueFromFrequency = () => {
    setCurrentStep('biometric');
  };

  const checkBiometricSupport = async () => {
    try {
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {

        return false;
      }

      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

      return available;
    } catch (error) {
      console.error('Biometric check failed:', error);

      return false;
    }
  };

  const setupBiometric = async () => {
    setLoading(true);
    setError('');

    try {
      const supported = await checkBiometricSupport();

      if (!supported) {
        setError('Biometric authentication is not supported on this device');
        setLoading(false);
        return;
      }

      // Create credential options
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Job Alerts",
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(16),
          name: registrationData.email,
          displayName: registrationData.email,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" }
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (credential) {
        setBiometricEnabled(true);
        setTimeout(() => {
          setCurrentStep('success');
        }, 1500);
      }
    } catch (err: unknown) {
      console.error('Biometric setup error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Biometric setup was cancelled');
        } else if (err.name === 'NotSupportedError') {
          setError('This device does not support biometric authentication');
        } else {
          setError('Failed to setup biometric authentication');
        }
      } else {
        setError('Failed to setup biometric authentication');
      }
    } finally {
      setLoading(false);
    }
  };

  const skipBiometric = () => {
    setCurrentStep('success');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Registration Page */}
      {currentStep === 'registration' && (
        <div className="min-h-screen flex">
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

          <div className="w-1/2 bg-white p-12 flex items-center justify-center">
            <div className="max-w-md w-full">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h2>
              <p className="text-gray-600 mb-8">Create an account to start receiving job alerts</p>

              <button
                onClick={handleTwitterLogin}
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                {loading ? 'Connecting...' : 'Connect with X (Twitter)'}
              </button>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>We need this to scan for personalized jobs.</p>
                <p className="mt-1">Read-only access. We can't post.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection */}
      {currentStep === 'categories' && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-cyan-500 to-blue-500 p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome! Let's Get Started 👋
              </h1>
              <p className="text-gray-600">
                Select the job categories you're interested in
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {jobCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`p-6 rounded-xl border-2 transition-all ${onboardingData.jobCategories.includes(category.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl">{category.icon}</span>
                    {onboardingData.jobCategories.includes(category.id) && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.label}</h3>
                </button>
              ))}
            </div>

            <button
              onClick={handleContinueFromCategories}
              disabled={onboardingData.jobCategories.length === 0}
              className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              Continue
            </button>

            <p className="text-sm text-gray-500 text-center mt-4">
              You can change these preferences anytime in Settings
            </p>
          </div>
        </div>
      )}

      {/* Alert Preferences */}
      {currentStep === 'alerts' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Where should we send your job alerts?
            </h2>
            <p className="text-gray-600 mb-8">
              Enter where we should send job alerts as soon as we find a match.
            </p>

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
              onClick={() => setCurrentStep('frequency')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Alert Frequency */}
      {currentStep === 'frequency' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              How fast do you want alerts?
            </h2>
            <p className="text-gray-600 mb-8">
              Choose how frequently you'd like to receive job notifications
            </p>

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
              onClick={handleContinueFromFrequency}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Biometric Setup */}
      {currentStep === 'biometric' && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fingerprint className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Secure Your Account
              </h1>
              <p className="text-gray-600">
                Enable biometric login for quick and secure access
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {biometricEnabled && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Biometric authentication enabled successfully!</span>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Why enable biometric login?
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Quick access with Face ID or fingerprint</li>
                    <li>• Enhanced security for your account</li>
                    <li>• No need to remember passwords</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={setupBiometric}
                disabled={loading || biometricEnabled}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                {loading ? 'Setting up...' : biometricEnabled ? 'Enabled' : 'Enable Biometric Login'}
              </button>

              <button
                onClick={skipBiometric}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Skip for Now
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              You can enable this later in Settings
            </p>
          </div>
        </div>
      )}

      {/* Success Screen */}
      {currentStep === 'success' && (
        <div className="min-h-screen flex items-center justify-center bg-white">
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