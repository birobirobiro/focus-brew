"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Pause,
  Play,
  RotateCcw,
  RepeatIcon,
  Volume2,
  Square,
  Timer,
} from "lucide-react";
import {
  sendPomodoroNotification,
  checkNotificationPermission,
  getNotificationSettings,
  NotificationSettings,
} from "@/lib/notification";
import { toast } from "@/lib/toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  volume: number;
  loopAudio: boolean;
}

const DEFAULT_SETTINGS: TimerSettings = {
  pomodoro: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
  volume: 50,
  loopAudio: false,
};

const SPRING_ANIMATION = {
  type: "spring",
  stiffness: 700,
  damping: 30,
} as const;

export function PomodoroTimer() {
  const t = useTranslations('components.pomodoroTimer');

  // Settings state
  const [settings, setSettings] = useLocalStorage<TimerSettings>(
    "pomodoro-settings",
    DEFAULT_SETTINGS
  );

  // Timer state
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const originalTitleRef = useRef<string>(
    typeof document !== "undefined"
      ? document.title
      : "FocusBrew | Productivity Workspace"
  );

  // Custom timer state
  const [customTimerDuration, setCustomTimerDuration] = useState(25);
  const [isCustomTimerDialogOpen, setIsCustomTimerDialogOpen] = useState(false);
  const [isUsingCustomTimer, setIsUsingCustomTimer] = useState(false);

  // Audio setup
  const alarmSound = useMemo(() => {
    if (typeof window === "undefined") return null;
    const audio = new Audio("/sounds/alarm.mp3");
    audio.volume = settings.volume / 100;
    audio.loop = settings.loopAudio;
    alarmRef.current = audio;
    return audio;
  }, [settings.loopAudio, settings.volume]);

  // Stop the alarm sound
  const stopAlarmSound = useCallback(() => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
      setIsAlarmPlaying(false);
    }
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    // Check notification permission on mount
    checkNotificationPermission()
      .then((hasPermission) => {
        setNotificationsEnabled(hasPermission);
      })
      .catch((error) => {
        console.error("Error verifying notification permission:", error);
      });
  }, []);

  useEffect(() => {
    if (alarmSound) {
      alarmSound.volume = settings.volume / 100;
    }
  }, [alarmSound, settings.volume]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    const total = isUsingCustomTimer
      ? customTimerDuration * 60
      : settings[mode];
    return ((total - timeLeft) / total) * 100;
  }, [timeLeft, settings, mode, isUsingCustomTimer, customTimerDuration]);

  // Format time as MM:SS
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, [timeLeft]);

  // Timer controls
  const handleStartTimer = useCallback(() => {
    stopAlarmSound();
    setIsRunning(true);
  }, [stopAlarmSound]);

  const handlePauseTimer = useCallback(() => setIsRunning(false), []);

  const handleStopTimer = useCallback(() => {
    setIsRunning(false);
    stopAlarmSound();
    if (isUsingCustomTimer) {
      setTimeLeft(customTimerDuration * 60);
    } else {
      setTimeLeft(settings[mode]);
    }
  }, [settings, mode, stopAlarmSound, isUsingCustomTimer, customTimerDuration]);

  const handleResetTimer = useCallback(() => {
    setIsRunning(false);
    stopAlarmSound();
    if (isUsingCustomTimer) {
      setTimeLeft(customTimerDuration * 60);
    } else {
      setTimeLeft(settings[mode]);
    }
  }, [settings, mode, stopAlarmSound, isUsingCustomTimer, customTimerDuration]);

  const handleSwitchMode = useCallback(
    (newMode: TimerMode) => {
      setMode(newMode);
      setIsRunning(false);
      stopAlarmSound();
      setTimeLeft(settings[newMode]);
      setIsUsingCustomTimer(false);
    },
    [settings, stopAlarmSound]
  );

  // Handle volume change
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0];
      setSettings((prev) => ({ ...prev, volume: newVolume }));
      if (alarmSound) {
        alarmSound.volume = newVolume / 100;
      }
    },
    [alarmSound, setSettings]
  );

  // Handle loop toggle
  const handleLoopToggle = useCallback(() => {
    setSettings((prev) => {
      const newLoopAudio = !prev.loopAudio;
      if (alarmSound) {
        alarmSound.loop = newLoopAudio;
      }
      return { ...prev, loopAudio: newLoopAudio };
    });
  }, [alarmSound, setSettings]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    try {
      const hasPermission = await checkNotificationPermission();
      setNotificationsEnabled(hasPermission);

      if (hasPermission) {
        toast.success(t('notifications.enabled.title'), {
          description: t('notifications.enabled.description'),
        });
      } else {
        toast.error(t('notifications.denied.title'), {
          description: t('notifications.denied.description'),
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  }, [t]);

  // Set custom timer
  const handleSetCustomTimer = useCallback(() => {
    if (customTimerDuration <= 0) {
      toast.error(t('customTimer.error.invalidDuration.title'), {
        description: t('customTimer.error.invalidDuration.description'),
      });
      return;
    }

    // Set the custom timer duration
    setTimeLeft(customTimerDuration * 60); // Convert to seconds
    setIsUsingCustomTimer(true);
    setIsRunning(false);
    stopAlarmSound();
    setIsCustomTimerDialogOpen(false);

    toast.success(t('customTimer.success.title'), {
      description: t('customTimer.success.description', { duration: customTimerDuration }),
    });
  }, [customTimerDuration, stopAlarmSound, t]);

  // Timer effect
  useEffect(() => {
    if (!isRunning) return;

    let animationFrameId: number;
    let lastUpdateTime = Date.now();

    const updateTimer = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTime;

      // If more than 1 second has passed
      if (deltaTime >= 1000) {
        const secondsToSubtract = Math.floor(deltaTime / 1000);

        setTimeLeft((prevTimeLeft) => {
          const newTimeLeft = Math.max(0, prevTimeLeft - secondsToSubtract);

          if (newTimeLeft <= 0 && prevTimeLeft > 0) {
            // Timer is done
            // Play sound if enabled
            if (alarmSound) {
              alarmSound.play().catch((error) => {
                console.error("Error playing audio:", error);
              });
              setIsAlarmPlaying(true);
            }

            // Send notification without playing the notification sound
            // The custom parameter ensures we're not playing the notification sound
            sendPomodoroNotification(
              mode === "pomodoro" || isUsingCustomTimer
                ? "work"
                : mode === "shortBreak"
                ? "break"
                : "longBreak",
              mode === "pomodoro" || isUsingCustomTimer
                ? settings.shortBreak / 60
                : settings.pomodoro / 60,
              t
            ).catch((error) => {
              console.error("Error sending notification:", error);
            });

            // Update pomodoro count and handle next timer
            if (isUsingCustomTimer) {
              // For custom timer, just reset the timer and stay in custom mode
              setCompletedPomodoros((count) => count + 1);
              setTimeLeft(customTimerDuration * 60);
              stopAlarmSound(); // Ensure sound stops
            } else if (mode === "pomodoro") {
              // Normal pomodoro flow
              setCompletedPomodoros((count) => count + 1);
              const nextMode =
                completedPomodoros % 4 === 3 ? "longBreak" : "shortBreak";
              handleSwitchMode(nextMode);
            } else {
              // After breaks, go back to pomodoro
              handleSwitchMode("pomodoro");
            }

            // Stop the timer but don't reset the time
            setIsRunning(false);
            return 0;
          }

          return newTimeLeft;
        });

        // Update the last update time, accounting for the exact seconds we've subtracted
        lastUpdateTime = now - (deltaTime % 1000);
      }

      if (isRunning) {
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    animationFrameId = requestAnimationFrame(updateTimer);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isRunning,
    mode,
    settings,
    alarmSound,
    completedPomodoros,
    handleSwitchMode,
    isUsingCustomTimer,
    customTimerDuration,
    stopAlarmSound,
    t
  ]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or rich text editor (like TipTap)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement &&
          (e.target.isContentEditable ||
            e.target.closest('[contenteditable="true"]') ||
            e.target.closest(".ProseMirror") ||
            e.target.closest(".editor-content")))
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          isRunning ? handlePauseTimer() : handleStartTimer();
          break;
        case "KeyR":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleResetTimer();
          }
          break;
        case "KeyS":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleStopTimer();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isRunning,
    handleStartTimer,
    handlePauseTimer,
    handleResetTimer,
    handleStopTimer,
  ]);

  // Listen for notification settings changes
  useEffect(() => {
    const handleNotificationSettingsChange = (
      e: CustomEvent<NotificationSettings>
    ) => {
      setNotificationsEnabled(e.detail.enabled);
    };

    // Use settings without creating cyclic dependencies
    const settings = getNotificationSettings();

    // Only check permission if settings indicate notifications are enabled
    if (settings.enabled) {
      checkNotificationPermission()
        .then((hasPermission) => {
          setNotificationsEnabled(hasPermission);
        })
        .catch((error) => {
          console.error("Error checking notification permission:", error);
        });
    } else if (notificationsEnabled) {
      // Disable notifications only if they are currently enabled
      setNotificationsEnabled(false);
    }
  }, [notificationsEnabled]); // Add notificationsEnabled as a dependency to avoid unnecessary updates

  // Update document title with timer
  useEffect(() => {
    if (isRunning) {
      const modeLabel = isUsingCustomTimer
        ? "Custom"
        : mode === "pomodoro"
        ? t('documentTitle.focus')
        : mode === "shortBreak"
        ? t('documentTitle.shortBreak')
        : t('documentTitle.longBreak');
      document.title = `${formattedTime} - ${modeLabel}`;
    } else {
      // Only reset if we're not showing the timer already
      if (
        document.title.includes(" - " + t('documentTitle.focus')) ||
        document.title.includes(" - " + t('documentTitle.shortBreak')) ||
        document.title.includes(" - " + t('documentTitle.longBreak')) ||
        document.title.includes(" - " + t('documentTitle.custom'))
      ) {
        document.title = originalTitleRef.current;
      }
    }

    return () => {
      document.title = originalTitleRef.current;
    };
  }, [isRunning, formattedTime, mode, isUsingCustomTimer, t]);

  return (
    <div
      className="flex flex-col items-center gap-6 p-6 h-full overflow-hidden"
      role="timer"
    >
      <ScrollArea className="w-full h-full">
        <div className="flex flex-col items-center gap-6 pb-6">
          {/* Mode selection with custom timer button */}
          <div className="flex gap-2 flex-wrap justify-center">
            {(["pomodoro", "shortBreak", "longBreak"] as const).map(
              (timerMode) => (
                <Button
                  key={timerMode}
                  variant={
                    mode === timerMode && !isUsingCustomTimer
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleSwitchMode(timerMode)}
                  className={cn(
                    "capitalize transition-colors",
                    mode === timerMode && !isUsingCustomTimer && "font-medium"
                  )}
                  aria-label={t('controls.aria.switchMode', { mode: t(`modes.${timerMode}`) })}
                >
                  {t(`modes.${timerMode}`)}
                </Button>
              )
            )}

            <Dialog
              open={isCustomTimerDialogOpen}
              onOpenChange={setIsCustomTimerDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant={isUsingCustomTimer ? "default" : "outline"}
                  className="min-w-[40px]"
                >
                  {t('customTimer.button')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('customTimer.title')}</DialogTitle>
                  <DialogDescription>
                    {t('customTimer.description')}
                  </DialogDescription>
                </DialogHeader>

                {/* Custom timer duration input - simplified */}
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="120"
                  value={customTimerDuration}
                  onChange={(e) =>
                    setCustomTimerDuration(
                      Math.min(120, Math.max(1, parseInt(e.target.value) || 1))
                    )
                  }
                  className="my-4"
                  placeholder={t('customTimer.placeholder')}
                />

                <Button onClick={handleSetCustomTimer} className="w-full">
                  {t('customTimer.setTimer')}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          {/* Timer display */}
          <div
            className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-border"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="absolute inset-1 rounded-full bg-primary/20"
              style={{
                scaleX: progress / 100,
                scaleY: progress / 100,
                transformOrigin: "center",
              }}
              animate={{ scale: progress / 100 }}
              transition={SPRING_ANIMATION}
            />
            <span className="relative text-4xl font-bold tabular-nums">
              {formattedTime}
            </span>
          </div>

          {/* Timer controls */}
          <div className="flex gap-2">
            <Button
              variant={isRunning ? "outline" : "default"}
              onClick={isRunning ? handlePauseTimer : handleStartTimer}
              className="min-w-[80px] cursor-pointer"
              aria-label={isRunning ? t('controls.aria.pauseTimer') : t('controls.aria.startTimer')}
            >
              {isRunning ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isRunning ? t('controls.pause') : t('controls.start')}
            </Button>
            <Button
              variant="outline"
              onClick={handleStopTimer}
              className="min-w-[80px]"
              aria-label={t('controls.aria.stopTimer')}
            >
              <Square className="h-4 w-4 mr-2" />
              {t('controls.stop')}
            </Button>
            <Button
              variant="outline"
              onClick={handleResetTimer}
              className="min-w-[80px]"
              aria-label={t('controls.aria.resetTimer')}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('controls.reset')}
            </Button>
          </div>

          {/* Volume and audio settings */}
          <div className="flex flex-col gap-4 w-48">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-4">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={[settings.volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="flex-1"
                      aria-label={t('audio.volume', { volume: settings.volume })}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('audio.volume', { volume: settings.volume })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoopToggle}
                    className={cn(
                      "flex items-center gap-2",
                      settings.loopAudio && "bg-primary/20"
                    )}
                  >
                    <RepeatIcon className="h-4 w-4" />
                    {settings.loopAudio ? t('audio.loop.on') : t('audio.loop.off')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {settings.loopAudio 
                      ? t('audio.loop.description.on')
                      : t('audio.loop.description.off')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Session counter */}
          <div className="text-sm text-muted-foreground">
            {t('stats.completedPomodoros', { count: completedPomodoros })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
