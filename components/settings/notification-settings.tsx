"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  isBrowserNotificationSupported,
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings as NotificationSettingsType,
  sendNotification,
  checkNotificationPermission,
  resetNotificationSettings,
} from "@/lib/notification";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from 'next-intl';

export function NotificationSettings() {
  const t = useTranslations('components.settings.notifications');
  const [settings, setSettings] = useState<NotificationSettingsType>({
    enabled: true,
    habitReminders: true,
    pomodoroNotifications: true,
  });
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  const [loading, setLoading] = useState(false);

  // Check if the browser supports notifications
  useEffect(() => {
    setNotificationsSupported(isBrowserNotificationSupported());
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = getNotificationSettings();

    // If the saved settings have notifications disabled, but this is the first load,
    // we'll reset to the default enabled state
    if (
      !savedSettings.enabled &&
      !localStorage.getItem("notification_settings_initialized")
    ) {
      localStorage.setItem("notification_settings_initialized", "true");
      resetNotificationSettings();
      setSettings({
        enabled: true,
        habitReminders: true,
        pomodoroNotifications: true,
      });
    } else {
      setSettings(savedSettings);
    }

    // Automatically request permission if notifications are enabled by default
    // but we don't have permission yet
    const checkAndRequestPermission = async () => {
      if (savedSettings.enabled && isBrowserNotificationSupported()) {
        await checkNotificationPermission();
      }
    };

    checkAndRequestPermission();
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    saveNotificationSettings(settings);
  }, [settings]);

  const requestNotificationPermission = async () => {
    setLoading(true);

    if (!notificationsSupported) {
      toast.error(t('errors.notSupported.title'), {
        description: t('errors.notSupported.description'),
      });
      setLoading(false);
      return;
    }

    try {
      const permission = await checkNotificationPermission();

      if (permission) {
        setSettings((prev) => ({ ...prev, enabled: true }));
        toast.success(t('success.enabled.title'), {
          description: t('success.enabled.description'),
        });
      } else {
        toast.error(t('errors.permissionDenied.title'), {
          description: t('errors.permissionDenied.description'),
        });
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      toast.error(t('errors.requestFailed.title'), {
        description: t('errors.requestFailed.description'),
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async () => {
    if (!settings.enabled) {
      await requestNotificationPermission();
    } else {
      setSettings((prev) => ({ ...prev, enabled: false }));
      toast.info(t('success.disabled.title'), {
        description: t('success.disabled.description'),
      });
    }
  };

  const testBrowserNotification = async () => {
    if (!settings.enabled) {
      toast.error(t('errors.disabled.title'), {
        description: t('errors.disabled.description'),
      });
      return;
    }

    setLoading(true);
    try {
      const sent = await sendNotification(t('test.title'), {
        body: t('test.body'),
        requireInteraction: false,
      });

      if (sent) {
        toast.success(t('test.success.title'), {
          description: t('test.success.description'),
        });
      } else {
        toast.error(t('test.error.title'), {
          description: t('test.error.description'),
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error(t('test.error.title'), {
        description: t('test.error.description'),
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    resetNotificationSettings();
    const defaultSettings = getNotificationSettings();
    setSettings(defaultSettings);
    toast.success(t('reset.success.title'), {
      description: t('reset.success.description'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('card.title')}</CardTitle>
        <CardDescription>{t('card.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!notificationsSupported && (
          <Alert className="border bg-yellow-500/20">
            <AlertDescription>{t('browserSupport.error')}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>{t('enable.label')}</Label>
            <p className="text-sm text-muted-foreground">{t('enable.description')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleNotifications}
            className="space-x-2"
            disabled={!notificationsSupported || loading}
          >
            {settings.enabled ? (
              <>
                <Bell className="h-4 w-4" />
                <span>{t('status.enabled')}</span>
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                <span>{t('status.disabled')}</span>
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('habits.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('habits.description')}</p>
            </div>
            <Switch
              checked={settings.enabled && settings.habitReminders}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, habitReminders: checked }))
              }
              disabled={!settings.enabled || !notificationsSupported || loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('pomodoro.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('pomodoro.description')}</p>
            </div>
            <Switch
              checked={settings.enabled && settings.pomodoroNotifications}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  pomodoroNotifications: checked,
                }))
              }
              disabled={!settings.enabled || !notificationsSupported || loading}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={testBrowserNotification}
          disabled={!settings.enabled || !notificationsSupported || loading}
          className="flex-1 min-w-[120px]"
          size="sm"
        >
          {t('buttons.test')}
        </Button>
        <Button
          variant="destructive"
          onClick={resetSettings}
          className="flex-1 min-w-[120px]"
          size="sm"
        >
          {t('buttons.reset')}
        </Button>
      </CardFooter>
    </Card>
  );
}
