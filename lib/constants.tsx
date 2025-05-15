import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  ListTodo,
  Kanban,
  Timer,
  FileText,
  Music,
  Youtube,
  Settings,
  CalendarCheck,
} from "lucide-react";
import { formatShortcut } from "./utils";
import { createTranslator } from 'next-intl';

export type AppId =
  | "todo"
  | "kanban"
  | "pomodoro"
  | "habit"
  | "notepad"
  | "ambient"
  | "youtube"
  | "settings";
export type SettingsTab = "about" | "general" | "wallpaper" | "appearance";

export interface AppMenuItem {
  id: AppId;
  label: string;
  icon: React.ReactNode;
  shortcutKey: string;
  /**
   * The shortcut text to display, will be generated dynamically
   * for cross-platform compatibility
   */
  getShortcutText?: () => string;
}

const createIcon = (Icon: LucideIcon) => <Icon className="h-6 w-6" />;

export const createAppItems = (t: ReturnType<typeof createTranslator>): AppMenuItem[] => [
  {
    id: "todo",
    label: t('apps.items.todo.label'),
    icon: createIcon(ListTodo),
    shortcutKey: "1",
    getShortcutText: () => formatShortcut("1"),
  },
  {
    id: "kanban",
    label: t('apps.items.kanban.label'),
    icon: createIcon(Kanban),
    shortcutKey: "2",
    getShortcutText: () => formatShortcut("2"),
  },
  {
    id: "habit",
    label: t('apps.items.habit.label'),
    icon: createIcon(CalendarCheck),
    shortcutKey: "3",
    getShortcutText: () => formatShortcut("3"),
  },
  {
    id: "pomodoro",
    label: t('apps.items.pomodoro.label'),
    icon: createIcon(Timer),
    shortcutKey: "4",
    getShortcutText: () => formatShortcut("4"),
  },
  {
    id: "notepad",
    label: t('apps.items.notepad.label'),
    icon: createIcon(FileText),
    shortcutKey: "5",
    getShortcutText: () => formatShortcut("5"),
  },
  {
    id: "ambient",
    label: t('apps.items.ambient.label'),
    icon: createIcon(Music),
    shortcutKey: "6",
    getShortcutText: () => formatShortcut("6"),
  },
  {
    id: "youtube",
    label: t('apps.items.youtube.label'),
    icon: createIcon(Youtube),
    shortcutKey: "7",
    getShortcutText: () => formatShortcut("7"),
  },
];

export const createSettingsApp = (t: ReturnType<typeof createTranslator>): AppMenuItem => ({
  id: "settings",
  label: t('apps.items.settings.label'),
  icon: createIcon(Settings),
  shortcutKey: "0",
  getShortcutText: () => formatShortcut("0"),
});
