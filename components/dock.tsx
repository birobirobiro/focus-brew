"use client";

import React, { useCallback, useEffect, useState, memo, useRef, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  AppId,
  createAppItems,
  createSettingsApp,
  type AppMenuItem,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useTranslations } from 'next-intl';

type DockProps = {
  openApp: (appId: AppId) => void;
  openSettings: () => void;
  openSettingsTab?: (tab: string) => void;
  activeApps: AppId[];
  minimizedApps: Set<string>;
  className?: string;
};

export function Dock({
  openApp,
  openSettings,
  openSettingsTab,
  activeApps,
  minimizedApps,
  className,
}: DockProps) {
  const t = useTranslations();
  const APP_ITEMS = createAppItems(t);
  const SETTINGS_APP = createSettingsApp(t);
  const DOCK_APPS = useMemo(() => [...APP_ITEMS, SETTINGS_APP], [APP_ITEMS, SETTINGS_APP]);

  const [mouseX, setMouseX] = useState(0);
  const dockRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  // Track mouse position for magnification effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    }
  }, []);

  // Reset mouse position when mouse leaves the dock
  const handleMouseLeave = useCallback(() => {
    setMouseX(0);
  }, []);

  // The keyboard navigation handler
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const appIndex = parseInt(e.key) - 1;
        if (appIndex >= 0 && appIndex < APP_ITEMS.length) {
          openApp(APP_ITEMS[appIndex].id);
        }
      }
    },
    [APP_ITEMS, openApp]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [openApp]);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-0 right-0 flex justify-center items-center",
        className
      )}
      style={{ zIndex: 9000 }}
    >
      <TooltipProvider>
        <motion.div
          className={cn(
            "p-2 rounded-2xl backdrop-blur-lg border shadow-lg",
            isLightTheme
              ? "bg-background/20 border-border/30"
              : "bg-background/20 border-border/30"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            delay: 0.3,
          }}
        >
          <motion.div
            className="flex items-center gap-2"
            ref={dockRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            layoutId="dock"
            layout
          >
            {DOCK_APPS.map((app, index) => (
              <DockItem
                key={app.id}
                app={app}
                isActive={activeApps.includes(app.id)}
                isMinimized={minimizedApps.has(app.id)}
                mouseX={mouseX}
                index={index}
                totalItems={DOCK_APPS.length}
                onClick={() => {
                  if (app.id === SETTINGS_APP.id) {
                    if (openSettingsTab) {
                      openSettingsTab("general");
                    } else {
                      openSettings();
                    }
                  } else {
                    openApp(app.id);
                  }
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </TooltipProvider>
    </div>
  );
}

// Constants for magnification effect
const ICON_SIZE = 48; // Base size in pixels
const MAGNIFICATION = 1.5; // How much to scale on hover
const MAGNET_DISTANCE = 100; // How far away the icons start to get affected

const DockItem = memo(
  ({
    app,
    isActive,
    isMinimized,
    mouseX,
    index,
    totalItems,
    onClick,
  }: {
    app: AppMenuItem;
    isActive: boolean;
    isMinimized: boolean;
    mouseX: number;
    index: number;
    totalItems: number;
    onClick: () => void;
  }) => {
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const itemRef = React.useRef<HTMLDivElement>(null);
    const [itemPosition, setItemPosition] = useState(0);

    const { theme } = useTheme();
    const isLightTheme = theme === "light";

    // Calculate distance from mouse to determine scale
    const distance = useMotionValue(0);

    // Update distance whenever mouseX changes
    useEffect(() => {
      distance.set(Math.abs(mouseX - itemPosition));
    }, [mouseX, itemPosition, distance]);

    const scale = useTransform(
      distance,
      [0, MAGNET_DISTANCE],
      [MAGNIFICATION, 1]
    );

    // Add spring physics for smooth animation
    const springScale = useSpring(scale, {
      damping: 20,
      stiffness: 350,
    });

    // Calculate this item's position for magnification effect
    useEffect(() => {
      if (!itemRef.current) return;
      const rect = itemRef.current.getBoundingClientRect();
      setItemPosition(rect.left + rect.width / 2);
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      },
      [onClick]
    );

    // Get the formatted shortcut text for the current platform
    const shortcutText = app.getShortcutText ? app.getShortcutText() : "";

    return (
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <motion.div
            ref={itemRef}
            style={{ scale: springScale }}
            onMouseEnter={() => {
              setTooltipOpen(true);
              setIsHovered(true);
            }}
            onMouseLeave={() => {
              setTooltipOpen(false);
              setIsHovered(false);
            }}
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                delay: 0.03 * index,
                type: "spring",
                stiffness: 400,
                damping: 25,
              },
            }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              className={cn(
                "relative flex items-center justify-center w-12 h-12 p-0 rounded-xl transition-all duration-150",
                isLightTheme
                  ? "bg-white/80 backdrop-blur-md shadow-sm border border-gray-200/30"
                  : "bg-zinc-800/80 backdrop-blur-md shadow-sm border border-zinc-700/30",
                isActive && isLightTheme && "ring-1 ring-primary/40",
                isActive && !isLightTheme && "border-primary/40",
                isMinimized && "opacity-60"
              )}
              whileHover={{
                y: -8,
                transition: { type: "spring", stiffness: 500, damping: 20 },
              }}
              whileTap={{ y: -2 }}
            >
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "w-full h-full p-0 transition-colors duration-150",
                  "flex items-center justify-center"
                )}
                aria-label={`Open ${app.label}${
                  shortcutText ? ` (${shortcutText})` : ""
                }`}
                onClick={() => {
                  onClick();
                  setTooltipOpen(false);
                }}
                onKeyDown={handleKeyDown}
                tabIndex={0}
              >
                <motion.div
                  animate={{
                    rotate: isHovered && !isActive ? [0, -5, 5, -5, 5, 0] : 0,
                    transition: { duration: 0.5, ease: "easeInOut" },
                  }}
                  className={cn(
                    "transition-all duration-200",
                    isLightTheme ? "text-foreground" : "text-foreground",
                    isHovered && "text-primary",
                    isActive && "text-primary scale-110"
                  )}
                >
                  {app.icon}
                </motion.div>
              </Button>
            </motion.div>
            <AnimatePresence>
              {(isActive || isHovered) && (
                <motion.div
                  className={cn(
                    "absolute -bottom-1.5 rounded-full",
                    isActive
                      ? "h-2 w-2.5 bg-primary"
                      : "h-1.5 w-1.5 bg-primary/70",
                    isMinimized && "opacity-60"
                  )}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                    },
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  layoutId={isActive ? `dot-${app.id}` : undefined}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="flex items-center gap-4 px-3 py-1.5 text-sm"
          sideOffset={8}
        >
          <span
            className={cn(
              "text-xs",
              isActive ? "font-semibold" : "font-medium"
            )}
          >
            {app.label}
            {isMinimized && " (Minimized)"}
          </span>
          {shortcutText && (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">{shortcutText}</span>
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }
);

DockItem.displayName = "DockItem";
