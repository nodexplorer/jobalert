// src/hooks/useSettings.ts (Custom Hook)

import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/settingsApi';
import type { UserSettings, ContactChannels, AlertSettings } from '../services/settingsApi';
import { toast } from 'react-hot-toast'; // Install: npm install react-hot-toast

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsAPI.getUserSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { display_name?: string; profile_image?: string }) => {
    try {
      setSaving(true);
      await settingsAPI.updateProfile(data);
      await loadSettings(); // Reload
      toast.success('Profile updated!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const updateContactChannels = async (data: ContactChannels) => {
    try {
      setSaving(true);
      await settingsAPI.updateContactChannels(data);
      await loadSettings();
      toast.success('Contact channels updated!');
    } catch (error) {
      console.error('Failed to update contact channels:', error);
      // specific error handling for axios response
      toast.error((error as any).response?.data?.detail || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const updateAlertSettings = async (data: AlertSettings) => {
    try {
      setSaving(true);
      await settingsAPI.updateAlertSettings(data);
      await loadSettings();
      toast.success('Alert settings updated!');
    } catch (error) {
      console.error('Failed to update alert settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updatePreferences = async (preferences: string[]) => {
    try {
      setSaving(true);
      await settingsAPI.updatePreferences(preferences);
      await loadSettings();
      toast.success('Preferences updated!');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    updateProfile,
    updateContactChannels,
    updateAlertSettings,
    updatePreferences,
    refresh: loadSettings,
  };
}
