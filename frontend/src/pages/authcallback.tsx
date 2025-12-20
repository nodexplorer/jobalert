// FILE: src/pages/AuthCallback.tsx

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const isNewUser = searchParams.get('new_user') === 'true';
      const errorMessage = searchParams.get('message');

      // Handle error
      if (errorMessage) {
        setError(errorMessage);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      // Handle success
      if (token) {
        try {
          await authService.handleCallback(token);
          
          // Redirect based on user status
          if (isNewUser) {
            navigate('/onboarding');  // Setup preferences
          } else {
            navigate('/dashboard');   // Go to dashboard
          }
        } catch {
          setError('Failed to authenticate');
          setTimeout(() => navigate('/'), 3000);
        }
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Logging you in...</h2>
        <p className="text-gray-600 mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  );
}