import { useCallback, useEffect, useState } from "react";
import { Command } from "cmdk";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppId, createAppItems, createSettingsApp } from "@/lib/constants";
import { useTranslations } from 'next-intl';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Info, X, RotateCcw } from "lucide-react";
import { toast } from "@/lib/toast";

type CommandPaletteProps = {
  openApp: (appId: AppId) => void;
  openSettings: () => void;
  openSettingsTab?: (tab: string) => void;
  activeApps: AppId[];
  closeAllApps?: () => void;
  resetAllWindows?: () => void;
};

export function CommandPalette({
  openApp,
  openSettings,
  openSettingsTab,
  activeApps,
  closeAllApps,
  resetAllWindows,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();
  const APP_ITEMS = createAppItems(t);
  const SETTINGS_APP = createSettingsApp(t);

  const handleReset = useCallback(() => {
    // Clear all localStorage data
    localStorage.clear();

    // Reset all windows
    resetAllWindows?.();

    // Feedback to user
    toast.success("Settings reset successfully", {
      description: "All settings have been reset to their default values.",
    });

    // Close command palette
    setOpen(false);

    // Reload the page to apply all reset settings
    setTimeout(() => {
      window.location.reload();
    }, 1000); // Small delay to show the toast before reload
  }, [resetAllWindows]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Add shortcut ⌘⇧W to close all windows
      if (e.key === "w" && e.metaKey && e.shiftKey) {
        e.preventDefault();
        closeAllApps?.();
      }

      // Add shortcut ⌘⇧R to reset all settings
      if (e.key === "r" && e.metaKey && e.shiftKey) {
        e.preventDefault();
        handleReset();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [closeAllApps, handleReset]);

  const handleSelect = useCallback(
    (command: string) => {
      setOpen(false);

      // Handle app launching
      if (command.startsWith("app-")) {
        const appId = command.replace("app-", "") as AppId;
        openApp(appId);
        return;
      }

      // Handle general commands
      switch (command) {
        case "settings":
          openSettings();
          break;
        case "about":
          if (openSettingsTab) {
            openSettingsTab("about");
          } else {
            openSettings();
          }
          break;
        case "close-all":
          closeAllApps?.();
          break;
        case "reset-all":
          handleReset();
          break;
        default:
          break;
      }
    },
    [openApp, openSettings, openSettingsTab, closeAllApps, handleReset]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border-none bg-background/80 backdrop-blur-xl">
        <CommandInput
          placeholder="Type a command or search..."
          className="border-none bg-transparent"
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Applications">
            {APP_ITEMS.map((app) => (
              <CommandItem
                key={app.id}
                value={`app-${app.id}`}
                onSelect={handleSelect}
                className={cn(
                  "flex items-center gap-2 px-2 py-3",
                  activeApps.includes(app.id) && "text-primary"
                )}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="h-4 w-4">{app.icon}</span>
                  <span>{app.label}</span>
                </div>
                {app.getShortcutText && (
                  <CommandShortcut>{app.getShortcutText()}</CommandShortcut>
                )}
              </CommandItem>
            ))}
            <CommandSeparator />
            <CommandItem
              value="settings"
              onSelect={handleSelect}
              className="flex items-center gap-2 px-2 py-3"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="h-4 w-4">{SETTINGS_APP.icon}</span>
                <span>{SETTINGS_APP.label}</span>
              </div>
              {SETTINGS_APP.getShortcutText && (
                <CommandShortcut>
                  {SETTINGS_APP.getShortcutText()}
                </CommandShortcut>
              )}
            </CommandItem>
            {activeApps.length > 0 && (
              <CommandItem
                value="close-all"
                onSelect={handleSelect}
                className="flex items-center gap-2 px-2 py-3"
              >
                <div className="flex items-center gap-2 flex-1">
                  <X className="h-4 w-4" />
                  <span>Close all windows</span>
                </div>
                <CommandShortcut>⌘⇧W</CommandShortcut>
              </CommandItem>
            )}
            <CommandItem
              value="reset-all"
              onSelect={handleSelect}
              className="flex items-center gap-2 px-2 py-3"
            >
              <div className="flex items-center gap-2 flex-1">
                <RotateCcw className="h-4 w-4" />
                <span>Reset all settings</span>
              </div>
              <CommandShortcut>⌘⇧R</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Help">
            <CommandItem
              value="about"
              onSelect={handleSelect}
              className="flex items-center gap-2 px-2 py-3"
            >
              <div className="flex items-center gap-2 flex-1">
                <Info className="h-4 w-4" />
                <span>About</span>
              </div>
              <CommandShortcut>⌘8</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
