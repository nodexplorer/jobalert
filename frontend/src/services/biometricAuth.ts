// FILE: src/services/biometricAuth.ts



export const biometricAuthService = {
  // Check if biometric is available
  isAvailable: async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
      return false;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.error('Biometric check failed:', error);
      return false;
    }
  },

  // Register biometric for user (call after onboarding)
  register: async (userId: number, username: string): Promise<boolean> => {
    try {
      // Request credential creation
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32), // In production, get from server
          rp: {
            name: 'X Job Bot',
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: username,
            displayName: username,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'none',
        },
      }) as PublicKeyCredential;

      if (!credential) {
        return false;
      }

      // Store credential ID in localStorage (in production, send to backend)
      const credentialData = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        type: credential.type,
      };

      localStorage.setItem(`biometric_${userId}`, JSON.stringify(credentialData));
      localStorage.setItem('biometric_enabled', 'true');

      return true;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      return false;
    }
  },

  // Authenticate using biometric
  authenticate: async (userId: number): Promise<boolean> => {
    try {
      const storedCredential = localStorage.getItem(`biometric_${userId}`);
      if (!storedCredential) {
        return false;
      }

      const credentialData = JSON.parse(storedCredential);

      // Request authentication
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32), // In production, get from server
          allowCredentials: [
            {
              id: new Uint8Array(credentialData.rawId),
              type: 'public-key',
            },
          ],
          timeout: 60000,
          userVerification: 'required',
        },
      });

      return !!assertion;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  },

  // Check if biometric is enabled for user
  isEnabled: (userId: number): boolean => {
    const stored = localStorage.getItem(`biometric_${userId}`);
    return !!stored;
  },

  // Disable biometric
  disable: (userId: number): void => {
    localStorage.removeItem(`biometric_${userId}`);
    localStorage.removeItem('biometric_enabled');
  },
};
