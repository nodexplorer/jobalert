// FILE: src/pages/BiometricSetup.tsx
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Shield, X, Smartphone } from 'lucide-react';
import { biometricAuthService } from '../services/biometricAuth';
import { authService } from '../services/auth';

export default function BiometricSetup() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const user = authService.getCurrentUser();

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    setLoading(true);
    const isAvailable = await biometricAuthService.isAvailable();
    setAvailable(isAvailable);
    setLoading(false);
  };

  const handleEnableBiometric = async () => {
    if (!user) return;

    setRegistering(true);
    setError('');

    try {
      const success = await biometricAuthService.register(user.id, user.username);

      if (success) {
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError('Failed to register biometric. Please try again.');
      }
    } catch {
      setError('Biometric registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <Fingerprint className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Secure Your Account
          </h1>
          <p className="text-gray-600">
            Enable biometric login for faster and more secure access
          </p>
        </div>

        {/* Biometric Status */}
        {!available ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Biometric Not Available
                </h3>
                <p className="text-sm text-yellow-700">
                  Your device doesn't support biometric authentication or it's not set up.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Features */}
            <div className="space-y-4 mb-8">
              <Feature
                icon={<Shield className="w-5 h-5" />}
                title="Enhanced Security"
                description="Your biometric data never leaves your device"
              />
              <Feature
                icon={<Fingerprint className="w-5 h-5" />}
                title="Quick Access"
                description="Login instantly with Face ID or Touch ID"
              />
              <Feature
                icon={<Smartphone className="w-5 h-5" />}
                title="Seamless Experience"
                description="No need to remember passwords"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Success Message */}
            {registering && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <div className="text-green-900 font-medium">
                    Setting up biometric authentication...
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleEnableBiometric}
                disabled={registering}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                {registering ? 'Setting up...' : 'Enable Biometric Login'}
              </button>

              <button
                onClick={handleSkip}
                disabled={registering}
                className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Skip for Now
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
              You can enable or disable biometric login anytime in Settings
            </p>
          </>
        )}

        {/* Skip button for unsupported devices */}
        {!available && (
          <button
            onClick={handleSkip}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors mt-6"
          >
            Continue to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}