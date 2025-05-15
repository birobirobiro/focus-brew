import { toast } from "@/lib/toast";

export interface NotificationSettings {
  enabled: boolean;
  habitReminders: boolean;
  pomodoroNotifications: boolean;
}

// Function to get notification settings from localStorage
export const getNotificationSettings = (): NotificationSettings => {
  if (typeof window === "undefined") {
    return {
      enabled: false,
      habitReminders: false,
      pomodoroNotifications: false,
    };
  }

  try {
    const savedSettings = localStorage.getItem("notification_settings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      console.log(
        "Loaded notification settings from localStorage:",
        parsedSettings
      );
      return parsedSettings;
    }
  } catch (error) {
    console.error("Failed to parse notification settings:", error);
  }

  // Default settings if nothing is saved - now enabled by default
  const defaultSettings = {
    enabled: true,
    habitReminders: true,
    pomodoroNotifications: true,
  };
  console.log("Using default notification settings:", defaultSettings);

  // Save default settings to localStorage on first load
  try {
    localStorage.setItem(
      "notification_settings",
      JSON.stringify(defaultSettings)
    );
  } catch (error) {
    console.error("Error saving default notification settings:", error);
  }

  return defaultSettings;
};

// Function to save notification settings
export const saveNotificationSettings = (
  settings: NotificationSettings
): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("notification_settings", JSON.stringify(settings));

    // Dispatch event to notify components about the change in settings
    window.dispatchEvent(
      new CustomEvent("notification_settings_changed", { detail: settings })
    );
  } catch (error) {
    console.error("Failed to save notification settings:", error);
  }
};

// Check if the browser supports notifications
export const isBrowserNotificationSupported = (): boolean => {
  return typeof window !== "undefined" && "Notification" in window;
};

// Request permission for notifications and return if it was granted
export const checkNotificationPermission = async (): Promise<boolean> => {
  if (!isBrowserNotificationSupported()) return false;

  if (Notification.permission === "granted") return true;

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

// Function to play the notification sound
export const playNotificationSound = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    try {
      // Stop any previously playing notification sound
      if (window._notificationSoundInstance) {
        try {
          window._notificationSoundInstance.pause();
          window._notificationSoundInstance.currentTime = 0;
        } catch (err) {
          console.error("Error stopping previous notification sound:", err);
        }
      }

      // Get the notification volume setting
      let notificationVolume = 1; // Default to full volume (0-1 scale)

      try {
        const volumeSettings = localStorage.getItem("volume_settings");
        if (volumeSettings) {
          const settings = JSON.parse(volumeSettings);
          // Normalize volume from 0-100 to 0-1
          notificationVolume = Math.max(
            0,
            Math.min(1, settings.notificationVolume / 100)
          );
        }
      } catch (error) {
        console.error("Error getting notification volume setting:", error);
      }

      // Make sure the audio file path is correct
      const audio = new Audio("/sounds/notification.mp3");

      // Store reference to the audio instance
      window._notificationSoundInstance = audio;

      // Set the volume based on the settings
      audio.volume = notificationVolume;

      // Preload the audio
      audio.preload = "auto";

      // Add event listeners to handle success and failure
      audio.addEventListener("canplaythrough", () => {
        // Play the audio when it's ready
        audio
          .play()
          .then(() => {
            console.log("Notification sound played successfully");
            resolve();
          })
          .catch((error) => {
            console.error("Failed to play notification sound:", error);
            resolve(); // Resolve anyway to not block execution
          });
      });

      audio.addEventListener("error", (e) => {
        console.error("Error loading notification sound:", e);
        resolve(); // Resolve anyway to not block execution
      });

      // Set a timeout in case the audio fails to load
      setTimeout(() => {
        resolve();
      }, 3000);
    } catch (error) {
      console.error("Error setting up notification sound:", error);
      resolve(); // Resolve anyway to not block execution
    }
  });
};

// Send a browser notification
export const sendNotification = async (
  title: string,
  options: NotificationOptions = {},
  playSound: boolean = true
): Promise<boolean> => {
  try {
    if (!isBrowserNotificationSupported()) return false;

    // Check permission
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return false;

    // Play notification sound if enabled
    if (playSound) {
      await playNotificationSound();
    }

    // Display notification
    const notification = new Notification(title, {
      icon: "/icon.png",
      ...options,
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Automatically close after 10 seconds, unless requireInteraction is true
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }

    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};

// Send habit reminder notification
export const sendHabitReminderNotification = async (
  habitName: string
): Promise<void> => {
  const settings = getNotificationSettings();

  // Always display toast
  toast.info("Habit Reminder", {
    description: `Time to complete your habit: ${habitName}`,
  });

  // If notifications are enabled, also send browser notification
  if (settings.enabled && settings.habitReminders) {
    try {
      // Request permission again if necessary
      const hasPermission = await checkNotificationPermission();

      if (!hasPermission) {
        console.log("Notification permission not granted");
        return;
      }

      // Play notification sound
      await playNotificationSound();

      // Send browser notification
      await sendNotification(
        "Habit Reminder",
        {
          body: `Time to complete your habit: ${habitName}`,
          tag: "habit-reminder",
          requireInteraction: true, // Requires user interaction to close
        },
        false // Don't play the sound again, since it was played above
      );

      console.log(`Notification sent for habit: ${habitName}`);
    } catch (error) {
      console.error("Error sending habit notification:", error);
    }
  }
};

// Send pomodoro notification
export const sendPomodoroNotification = async (
  type: "work" | "break" | "longBreak",
  duration: number,
  t: (key: string, params?: Record<string, any>) => string
): Promise<void> => {
  const settings = getNotificationSettings();

  const messages = {
    work: {
      title: t('notifications.pomodoro.work.title'),
      body: t('notifications.pomodoro.work.body', { duration }),
    },
    break: {
      title: t('notifications.pomodoro.break.title'),
      body: t('notifications.pomodoro.break.body'),
    },
    longBreak: {
      title: t('notifications.pomodoro.longBreak.title'),
      body: t('notifications.pomodoro.longBreak.body'),
    },
  };

  const { title, body } = messages[type];

  // Always display toast
  toast.info(title, { description: body });

  // If notifications are enabled, also send browser notification
  if (settings.enabled && settings.pomodoroNotifications) {
    // Don't play notification sound for pomodoro notifications
    // The alarm sound is already handled by the pomodoro-timer component

    await sendNotification(
      title,
      {
        body,
        tag: "pomodoro",
        requireInteraction: type === "work", // Work notifications require interaction
      },
      false // Don't play sound in sendNotification
    );
  }
};

// Reset notification settings to default
export const resetNotificationSettings = (): void => {
  if (typeof window === "undefined") return;

  try {
    // Default settings with notifications enabled
    const defaultSettings = {
      enabled: true,
      habitReminders: true,
      pomodoroNotifications: true,
    };

    // Remove any existing settings first
    localStorage.removeItem("notification_settings");

    // Save the default settings
    localStorage.setItem(
      "notification_settings",
      JSON.stringify(defaultSettings)
    );

    // Trigger the event to notify components
    window.dispatchEvent(
      new CustomEvent("notification_settings_changed", {
        detail: defaultSettings,
      })
    );

    console.log("Notification settings reset to defaults:", defaultSettings);
  } catch (error) {
    console.error("Failed to reset notification settings:", error);
  }
};
