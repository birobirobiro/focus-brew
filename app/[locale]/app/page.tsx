"use client";

import { type AppWindow as AppWindowType } from "@/types/window";
import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import { AnimatePresence } from "framer-motion";
import { Desktop } from "@/components/desktop";
import { AppWindow } from "@/components/app-window";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { type SettingsTab } from "@/lib/constants";
import { Bootloader } from "@/components/boot/Bootloader";
import { stopAllAmbientSounds } from "@/components/apps/ambient-sounds";
import { useTheme } from "next-themes";
import { LoadingFallback } from "@/components/ui/loading-fallback";
import { CommandPalette } from "@/components/command-palette";

// Lazy load components
const TodoApp = lazy(() =>
  import("@/components/apps/todo-app").then((mod) => ({ default: mod.TodoApp }))
);
const PomodoroTimer = lazy(() =>
  import("@/components/apps/pomodoro-timer").then((mod) => ({
    default: mod.PomodoroTimer,
  }))
);
const Settings = lazy(() =>
  import("@/components/settings").then((mod) => ({ default: mod.Settings }))
);
const Dock = lazy(() =>
  import("@/components/dock").then((mod) => ({ default: mod.Dock }))
);
const MenuBar = lazy(() =>
  import("@/components/menu-bar").then((mod) => ({ default: mod.MenuBar }))
);
const AmbientSounds = lazy(() =>
  import("@/components/apps/ambient-sounds").then((mod) => ({
    default: mod.AmbientSounds,
  }))
);
const Notepad = lazy(() =>
  import("@/components/apps/notepad").then((mod) => ({ default: mod.Notepad }))
);
const KanbanBoard = lazy(() => import("@/components/apps/kanban/KanbanBoard"));
const YouTubePlayer = lazy(() =>
  import("@/components/apps/youtube-player").then((mod) => ({
    default: mod.YouTubePlayer,
  }))
);
const HabitTracker = lazy(() =>
  import("@/components/apps/habit-tracker").then((mod) => ({
    default: mod.HabitTracker,
  }))
);

const DEFAULT_WINDOW_SIZES = {
  default: { width: 700, height: 500 },
  kanban: { width: 1000, height: 600 },
  youtube: { width: 580, height: 850 },
  ambient: { width: 1100, height: 1000 },
  pomodoro: { width: 700, height: 550 },
  notepad: { width: 800, height: 650 },
  habit: { width: 450, height: 800 },
  settings: { width: 850, height: 650 },
} as const;

const APP_TITLES = {
  todo: "Tasks",
  kanban: "Kanban",
  pomodoro: "Focus Timer",
  notepad: "Notes",
  ambient: "Ambient Sounds",
  youtube: "YouTube Player",
  settings: "Settings",
  habit: "Habit Tracker",
} as const;

type AppId = keyof typeof APP_TITLES;

interface WindowState extends Omit<AppWindowType, "id"> {
  id: AppId;
}

function useWindowManager() {
  const [windows, setWindows] = useLocalStorage<WindowState[]>("windows", []);
  const windowsRef = useRef<WindowState[]>(windows);
  const [minimizedWindows, setMinimizedWindows] = useState<Set<string>>(
    new Set()
  );

  // Keep ref updated
  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  const resetAllWindows = useCallback(() => {
    setWindows([]);
    setMinimizedWindows(new Set());
    if (typeof window !== "undefined") {
      localStorage.removeItem("windows");
    }
  }, [setWindows]);

  const bringToFront = useCallback(
    (appId: AppId) => {
      setWindows((prev) => {
        const appWindow = prev.find((w) => w.id === appId);
        if (!appWindow) return prev;

        const windowsWithoutApp = prev.filter((w) => w.id !== appId);
        return [...windowsWithoutApp, appWindow];
      });
    },
    [setWindows]
  );

  const openApp = useCallback(
    (appId: AppId | string) => {
      const validAppId = appId as AppId;
      const currentWindows = windowsRef.current;

      // If the window already exists and is minimized, restore it and bring it to front
      if (minimizedWindows.has(validAppId)) {
        setMinimizedWindows((prev) => {
          const next = new Set(prev);
          next.delete(validAppId);
          return next;
        });

        // Make sure the window is brought to front after being restored
        setTimeout(() => {
          bringToFront(validAppId);
        }, 10);

        return;
      }

      // If the window already exists, just bring it to front
      if (currentWindows.some((w) => w.id === validAppId)) {
        bringToFront(validAppId);
        return;
      }

      // If it doesn't exist, create a new window
      const zIndex = currentWindows.length;
      const defaultSize =
        DEFAULT_WINDOW_SIZES[validAppId as keyof typeof DEFAULT_WINDOW_SIZES] ||
        DEFAULT_WINDOW_SIZES.default;

      setWindows((prev) => [
        ...prev,
        {
          id: validAppId,
          position: { x: 50 + zIndex * 20, y: 50 + zIndex * 20 },
          size: defaultSize,
        },
      ]);
    },
    [setWindows, minimizedWindows, bringToFront]
  );

  const minimizeApp = useCallback((appId: AppId) => {
    setMinimizedWindows((prev) => {
      const next = new Set(prev);
      next.add(appId);
      return next;
    });
  }, []);

  const closeApp = useCallback(
    (appId: AppId) => {
      try {
        // Stop ambient sounds if closing the ambient sounds app
        if (appId === "ambient") {
          stopAllAmbientSounds();
        }

        setWindows((prev) => prev.filter((w) => w.id !== appId));
        setMinimizedWindows((prev) => {
          const next = new Set(prev);
          next.delete(appId);
          return next;
        });
      } catch (error) {
        console.error("Error closing app:", error);
      }
    },
    [setWindows]
  );

  const updateWindow = useCallback(
    (
      appId: AppId,
      position: { x: number; y: number },
      size: { width: number; height: number }
    ) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === appId ? { ...w, position, size } : w))
      );
    },
    [setWindows]
  );

  return {
    windows,
    openApp,
    closeApp,
    bringToFront,
    updateWindow,
    resetAllWindows,
    minimizeApp,
    minimizedWindows,
  };
}

export default function AppPage() {
  const [wallpaper, setWallpaper] = useLocalStorage(
    "wallpaper",
    "/wallpapers/default.webp"
  );
  const [font, setFont] = useLocalStorage("font", "font-satoshi");
  const { theme = "dark", setTheme } = useTheme();
  const [isBooting, setIsBooting] = useState(true);
  const settingsTabRef = useRef<SettingsTab | null>(null);

  const {
    windows,
    openApp,
    closeApp,
    bringToFront,
    updateWindow,
    resetAllWindows,
    minimizeApp,
    minimizedWindows,
  } = useWindowManager();

  // Create handlers for the openApp and openSettingsTab functions
  const handleOpenApp = useCallback(
    (appId: AppId) => {
      openApp(appId);
    },
    [openApp]
  );

  const handleOpenSettingsTab = useCallback(
    (tab: SettingsTab) => {
      openApp("settings");
      settingsTabRef.current = tab;

      // Increase timeout to ensure Settings component is fully mounted
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("open-settings-tab", { detail: tab })
        );
      }, 300);
    },
    [openApp]
  );

  // Memoize app content for better performance
  const getAppContent = useCallback(
    (appId: AppId) => {
      switch (appId) {
        case "todo":
          return (
            <Suspense fallback={<LoadingFallback variant="app" />}>
              <TodoApp />
            </Suspense>
          );
        case "kanban":
          return (
            <Suspense fallback={<LoadingFallback variant="app" />}>
              <KanbanBoard />
            </Suspense>
          );
        case "pomodoro":
          return (
            <Suspense fallback={<LoadingFallback variant="app" />}>
              <PomodoroTimer />
            </Suspense>
          );
        case "notepad":
          return (
            <Suspense fallback={<LoadingFallback variant="app" />}>
              <Notepad />
            </Suspense>
          );
        case "ambient":
          return (
            <Suspense fallback={<LoadingFallback variant="app" />}>
              <AmbientSounds />
            </Suspense>
          );
        case "youtube":
          return (
            <Suspense fallback={<LoadingFallback variant="app" />}>
              <YouTubePlayer />
            </Suspense>
          );
        case "habit":
          return (
            <Suspense fallback={<LoadingFallback variant="app" />}>
              <HabitTracker />
            </Suspense>
          );
        case "settings":
          return (
            <Suspense fallback={<LoadingFallback variant="app" />}>
              <Settings
                wallpaper={wallpaper}
                setWallpaper={setWallpaper}
                font={font}
                setFont={setFont}
                theme={theme}
                setTheme={setTheme}
                initialTab={settingsTabRef.current || "general"}
              />
            </Suspense>
          );
        default:
          return null;
      }
    },
    [wallpaper, setWallpaper, font, setFont, theme, setTheme]
  );

  // Create optimized window update handlers
  const createUpdateHandler = useCallback(
    (winId: AppId) =>
      (
        pos: { x: number; y: number },
        sz: { width: number; height: number }
      ) => {
        updateWindow(winId, pos, sz);
      },
    [updateWindow]
  );

  // Create optimized close handlers
  const createCloseHandler = useCallback(
    (winId: AppId) => () => {
      closeApp(winId);
    },
    [closeApp]
  );

  // Create optimized focus handlers
  const createFocusHandler = useCallback(
    (winId: AppId) => () => {
      bringToFront(winId);
    },
    [bringToFront]
  );

  // Memoize window elements for better performance
  const windowElements = useMemo(
    () =>
      windows.map((win, i) => (
        <AppWindow
          key={win.id}
          id={win.id}
          title={APP_TITLES[win.id]}
          onClose={createCloseHandler(win.id)}
          onFocus={createFocusHandler(win.id)}
          onMinimize={() => minimizeApp(win.id)}
          isMinimized={minimizedWindows.has(win.id)}
          zIndex={i}
          position={win.position}
          size={win.size}
          onUpdate={createUpdateHandler(win.id)}
        >
          {getAppContent(win.id)}
        </AppWindow>
      )),
    [
      windows,
      getAppContent,
      createCloseHandler,
      createFocusHandler,
      createUpdateHandler,
      minimizeApp,
      minimizedWindows,
    ]
  );

  // Add a dedicated function for opening settings
  const handleOpenSettings = useCallback(() => {
    openApp("settings");
  }, [openApp]);

  // Add function to close all apps
  const closeAllApps = useCallback(() => {
    // Get all app IDs, including minimized ones
    const openApps = windows.map((w) => w.id);

    // Include minimized apps
    const minimizedApps = Array.from(minimizedWindows) as AppId[];

    // Create a combined list of all apps to close
    const allAppsToClose = [...new Set([...openApps, ...minimizedApps])];

    // Close each app
    allAppsToClose.forEach((appId) => {
      closeApp(appId);
    });
  }, [windows, closeApp, minimizedWindows]);

  // Render desktop content
  const desktopContent = (
    <div
      className={`${font} h-screen overflow-hidden`}
      style={{
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Suspense>
        <MenuBar
          openApp={handleOpenApp}
          openSettings={handleOpenSettings}
          openSettingsTab={handleOpenSettingsTab}
          activeApps={windows.map((w) => w.id)}
        />
      </Suspense>

      <Desktop>
        <AnimatePresence>{windowElements}</AnimatePresence>
      </Desktop>

      <Suspense>
        <Dock
          openApp={handleOpenApp}
          openSettings={handleOpenSettings}
          openSettingsTab={handleOpenSettingsTab as (tab: string) => void}
          activeApps={windows.map((w) => w.id)}
          minimizedApps={minimizedWindows}
        />
      </Suspense>

      <CommandPalette
        openApp={handleOpenApp}
        openSettings={handleOpenSettings}
        openSettingsTab={handleOpenSettingsTab as (tab: string) => void}
        activeApps={windows.map((w) => w.id)}
        closeAllApps={closeAllApps}
        resetAllWindows={resetAllWindows}
      />
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {isBooting ? (
        <Bootloader
          key="bootloader"
          onComplete={() => setIsBooting(false)}
          minimumDisplayTime={2500}
        />
      ) : (
        desktopContent
      )}
    </AnimatePresence>
  );
}
