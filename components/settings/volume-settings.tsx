"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from 'next-intl';

// Constants
const MAX_VOLUME = 100;
const MIN_VOLUME = 0;
const DEFAULT_VOLUME = 80;

// Type for volume settings
export interface VolumeSettings {
  masterVolume: number;
  notificationVolume: number;
}

// Function to normalize volume from UI (0-100) to audio (0-1)
export const normalizeVolume = (volume: number): number => {
  return Math.max(0, Math.min(1, volume / MAX_VOLUME));
};

// Get volume settings from localStorage
export const getVolumeSettings = (): VolumeSettings => {
  if (typeof window === "undefined") {
    return {
      masterVolume: DEFAULT_VOLUME,
      notificationVolume: DEFAULT_VOLUME,
    };
  }

  const savedSettings = localStorage.getItem("volume_settings");
  if (!savedSettings) {
    return {
      masterVolume: DEFAULT_VOLUME,
      notificationVolume: DEFAULT_VOLUME,
    };
  }

  try {
    return JSON.parse(savedSettings);
  } catch (error) {
    console.error("Failed to parse volume settings:", error);
    return {
      masterVolume: DEFAULT_VOLUME,
      notificationVolume: DEFAULT_VOLUME,
    };
  }
};

// Save volume settings to localStorage
export const saveVolumeSettings = (settings: VolumeSettings): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("volume_settings", JSON.stringify(settings));
    // Dispatch custom event so other components can react to volume changes
    window.dispatchEvent(
      new CustomEvent("volume_settings_changed", { detail: settings })
    );
  } catch (error) {
    console.error("Failed to save volume settings:", error);
  }
};

// Reset volume settings to defaults
export const resetVolumeSettings = (): VolumeSettings => {
  const defaultSettings: VolumeSettings = {
    masterVolume: DEFAULT_VOLUME,
    notificationVolume: DEFAULT_VOLUME,
  };

  saveVolumeSettings(defaultSettings);
  return defaultSettings;
};

// Play test sound for volume preview
export const playTestSound = (
  volume: number,
  soundType: "notification" | "system" = "notification"
): void => {
  // Stop any previously playing test sounds
  if (window._testSoundInstance) {
    try {
      window._testSoundInstance.pause();
      window._testSoundInstance.currentTime = 0;
    } catch (err) {
      console.error("Error stopping previous test sound:", err);
    }
  }

  try {
    const audio = new Audio(
      soundType === "notification"
        ? "/sounds/notification.mp3"
        : "/sounds/things/wind-chimes.mp3"
    );
    audio.volume = normalizeVolume(volume);

    // Store the audio instance globally so we can stop it later
    window._testSoundInstance = audio;

    audio.play().catch((err) => {
      console.error("Error playing test sound:", err);
    });
  } catch (error) {
    console.error("Error setting up test sound:", error);
  }
};

export function VolumeSettings() {
  const t = useTranslations('components.settings.volume');
  const [settings, setSettings] = useState<VolumeSettings>({
    masterVolume: DEFAULT_VOLUME,
    notificationVolume: DEFAULT_VOLUME,
  });
  const [isTestingMaster, setIsTestingMaster] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    setSettings(getVolumeSettings());
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    // Clear any previous save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout to save settings (debounce)
    saveTimeoutRef.current = setTimeout(() => {
      saveVolumeSettings(settings);
    }, 300);

    // Clean up timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [settings]);

  const handleMasterVolumeChange = (value: number[]) => {
    const volume = value[0];
    setSettings((prev) => ({ ...prev, masterVolume: volume }));
  };

  const handleNotificationVolumeChange = (value: number[]) => {
    const volume = value[0];
    setSettings((prev) => ({ ...prev, notificationVolume: volume }));
  };

  const testMasterVolume = () => {
    if (isTestingMaster) return; // Prevent multiple clicks

    setIsTestingMaster(true);
    playTestSound(settings.masterVolume, "system");
    toast.info(t('test.master.title'), {
      description: t('test.master.description'),
    });

    // Reset the testing state after a short delay
    setTimeout(() => setIsTestingMaster(false), 1000);
  };

  const testNotificationVolume = () => {
    if (isTestingNotification) return; // Prevent multiple clicks

    setIsTestingNotification(true);
    playTestSound(settings.notificationVolume, "notification");
    toast.info(t('test.notification.title'), {
      description: t('test.notification.description'),
    });

    // Reset the testing state after a short delay
    setTimeout(() => setIsTestingNotification(false), 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('card.title')}</CardTitle>
        <CardDescription>{t('card.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('master.label')}</Label>
              <span className="text-xs text-muted-foreground">
                {settings.masterVolume}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              {settings.masterVolume === 0 ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              )}
              <Slider
                value={[settings.masterVolume]}
                min={MIN_VOLUME}
                max={MAX_VOLUME}
                step={1}
                onValueChange={handleMasterVolumeChange}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={testMasterVolume}
                className="h-8 text-xs"
                disabled={isTestingMaster}
              >
                {t('buttons.test')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('master.description')}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('notification.label')}</Label>
              <span className="text-xs text-muted-foreground">
                {settings.notificationVolume}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              {settings.notificationVolume === 0 ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              )}
              <Slider
                value={[settings.notificationVolume]}
                min={MIN_VOLUME}
                max={MAX_VOLUME}
                step={1}
                onValueChange={handleNotificationVolumeChange}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={testNotificationVolume}
                className="h-8 text-xs"
                disabled={isTestingNotification}
              >
                {t('buttons.test')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('notification.description')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
