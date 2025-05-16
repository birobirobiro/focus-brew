"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { format, startOfToday, subDays, isSameDay, isToday } from "date-fns";
import { enUS, ptBR } from 'date-fns/locale';
import {
  Check,
  Plus,
  Edit,
  Trash2,
  Calendar,
  BarChart3,
  Flame,
  ChevronLeft,
  ChevronRight,
  Bell,
  MoreHorizontal,
  Filter,
  Info,
  Sparkles,
} from "lucide-react";
import { useTranslations, useLocale } from 'next-intl';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sendHabitReminderNotification } from "@/lib/notification";
import {
  type NotificationSettings,
  getNotificationSettings,
} from "@/lib/notification";

// Types
type FrequencyType = "daily" | "weekly" | "custom";
type HabitCategory =
  | "health"
  | "fitness"
  | "productivity"
  | "learning"
  | "mindfulness"
  | "other";

interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: FrequencyType;
  category: HabitCategory;
  createdAt: string;
  completedDates: string[];
  reminderTime?: string;
  reminderEnabled?: boolean;
  customDays?: string[]; // For custom frequency (e.g., "mon", "wed", "fri")
  duration: number; // Number of times to complete
  period: "days" | "weeks" | "months"; // Period for the duration
}

// Icons for habits
const HABIT_ICONS = [
  "💧",
  "🏃",
  "📚",
  "🧘",
  "💪",
  "🥗",
  "💊",
  "😴",
  "🧠",
  "🎯",
  "💻",
  "🎨",
  "🎵",
  "🌱",
  "✍️",
  "🧹",
];

// Colors for habits
const HABIT_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#14b8a6", // teal
];

// Categories
const CATEGORIES: Record<HabitCategory, { label: string; icon: string }> = {
  health: { label: "health", icon: "💊" },
  fitness: { label: "fitness", icon: "💪" },
  productivity: { label: "productivity", icon: "💻" },
  learning: { label: "learning", icon: "📚" },
  mindfulness: { label: "mindfulness", icon: "🧘" },
  other: { label: "other", icon: "🎯" },
};

// Days of the week for custom frequency
const DAYS_OF_WEEK = [
  { value: "mon", label: "mon" },
  { value: "tue", label: "tue" },
  { value: "wed", label: "wed" },
  { value: "thu", label: "thu" },
  { value: "fri", label: "fri" },
  { value: "sat", label: "sat" },
  { value: "sun", label: "sun" },
];

// Local storage key
const STORAGE_KEY = "habit_tracker_data";

// Helper functions
const calculateStreak = (completedDates: string[]): number => {
  if (!completedDates.length) return 0;

  // Sort dates in descending order
  const sortedDates = [...completedDates]
    .map((date) => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = startOfToday();
  const yesterday = subDays(today, 1);

  // Check if the most recent date is today or yesterday
  const mostRecentDate = sortedDates[0];
  if (
    !isSameDay(mostRecentDate, today) &&
    !isSameDay(mostRecentDate, yesterday)
  ) {
    return 0; // Streak broken if not completed today or yesterday
  }

  let streak = 1; // Start with 1 for the most recent day
  let currentDate = mostRecentDate;

  // Check consecutive days backwards
  for (let i = 1; i < sortedDates.length; i++) {
    const expectedPrevDate = subDays(currentDate, 1);
    if (isSameDay(sortedDates[i], expectedPrevDate)) {
      streak++;
      currentDate = sortedDates[i];
    } else {
      break; // Streak broken
    }
  }

  return streak;
};

const calculateCompletionRate = (habit: Habit): number => {
  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => subDays(today, i));

  // Count completed days in the last 30 days
  const completedInLast30Days = last30Days.filter((date) =>
    habit.completedDates.some((completedDate) =>
      isSameDay(new Date(completedDate), date)
    )
  ).length;

  return Math.round((completedInLast30Days / 30) * 100);
};

const shouldCompleteToday = (habit: Habit): boolean => {
  const today = new Date();
  const dayOfWeek = today
    .toLocaleDateString("en-US", { weekday: "short" })
    .toLowerCase();

  // First check if it's a valid day based on frequency
  let isValidDay = false;
  if (habit.frequency === "daily") {
    isValidDay = true;
  } else if (habit.frequency === "weekly") {
    // For weekly habits, check if it's been completed this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

    isValidDay = !habit.completedDates.some((date) => {
      const completedDate = new Date(date);
      return completedDate >= startOfWeek && completedDate <= today;
    });
  } else if (habit.frequency === "custom" && habit.customDays) {
    isValidDay = habit.customDays.includes(dayOfWeek.substring(0, 3));
  }

  if (!isValidDay) return false;

  // Then check if we've met the duration requirement for the period
  const periodStart = new Date(today);
  switch (habit.period) {
    case "days":
      periodStart.setDate(today.getDate() - habit.duration + 1);
      break;
    case "weeks":
      periodStart.setDate(today.getDate() - habit.duration * 7 + 1);
      break;
    case "months":
      periodStart.setMonth(today.getMonth() - habit.duration + 1);
      break;
  }

  const completionsInPeriod = habit.completedDates.filter((date) => {
    const completedDate = new Date(date);
    return completedDate >= periodStart && completedDate <= today;
  }).length;

  return completionsInPeriod < habit.duration;
};

// Components
const HabitForm = ({
  onSave,
  onCancel,
  initialHabit,
}: {
  onSave: (habit: Omit<Habit, "id" | "createdAt" | "completedDates">) => void;
  onCancel: () => void;
  initialHabit?: Habit;
}) => {
  const t = useTranslations('components.habitTracker');
  const [name, setName] = useState(initialHabit?.name || "");
  const [description, setDescription] = useState(
    initialHabit?.description || ""
  );
  const [icon, setIcon] = useState(initialHabit?.icon || HABIT_ICONS[0]);
  const [color, setColor] = useState(initialHabit?.color || HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<FrequencyType>(
    initialHabit?.frequency || "daily"
  );
  const [category, setCategory] = useState<HabitCategory>(
    initialHabit?.category || "other"
  );
  const [customDays, setCustomDays] = useState<string[]>(
    initialHabit?.customDays || []
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    initialHabit?.reminderEnabled || false
  );

  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [reminderTime, setReminderTime] = useState(
    initialHabit?.reminderTime || getCurrentTimeString()
  );
  const [duration, setDuration] = useState(initialHabit?.duration || 1);
  const [period, setPeriod] = useState<"days" | "weeks" | "months">(
    initialHabit?.period || "days"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newHabit = {
      name,
      description,
      icon,
      color,
      frequency,
      category,
      customDays: frequency === "custom" ? customDays : undefined,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      duration,
      period,
    };

    onSave(newHabit);
  };

  const toggleCustomDay = (day: string) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter((d) => d !== day));
    } else {
      setCustomDays([...customDays, day]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          {t('form.fields.name.label')}
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('form.fields.name.placeholder')}
          required
          className="h-10 border-0 bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          {t('form.fields.description.label')}
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('form.fields.description.placeholder')}
          rows={2}
          className="border-0 bg-muted resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">{t('form.fields.icon')}</Label>
        <div className="grid grid-cols-8 gap-2">
          {HABIT_ICONS.map((habitIcon) => (
            <button
              key={habitIcon}
              type="button"
              className={cn(
                "h-10 w-10 flex items-center justify-center text-lg transition-all",
                icon === habitIcon
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
              onClick={() => setIcon(habitIcon)}
            >
              {habitIcon}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">{t('form.fields.color')}</Label>
        <div className="grid grid-cols-8 gap-2">
          {HABIT_COLORS.map((habitColor) => (
            <button
              key={habitColor}
              type="button"
              className={cn(
                "h-8 w-8 transition-all",
                color === habitColor ? "ring-2 ring-offset-2" : ""
              )}
              style={{ backgroundColor: habitColor }}
              onClick={() => setColor(habitColor)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium">
          {t('form.fields.category.label')}
        </Label>
        <Select
          value={category}
          onValueChange={(value: HabitCategory) => setCategory(value)}
        >
          <SelectTrigger className="h-10 border-0 bg-muted focus:ring-0">
            <SelectValue placeholder={t('form.fields.category.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center">
                  <span className="mr-2">{icon}</span>
                  <span>{t(`categories.${label}`)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency" className="text-sm font-medium">
          {t('form.fields.frequency.label')}
        </Label>
        <Select
          value={frequency}
          onValueChange={(value: FrequencyType) => setFrequency(value)}
        >
          <SelectTrigger className="h-10 border-0 bg-muted focus:ring-0">
            <SelectValue placeholder={t('form.fields.frequency.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">{t('form.fields.frequency.options.daily')}</SelectItem>
            <SelectItem value="weekly">{t('form.fields.frequency.options.weekly')}</SelectItem>
            <SelectItem value="custom">{t('form.fields.frequency.options.custom')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {frequency === "custom" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('form.fields.customDays.label')}</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                className={cn(
                  "px-3 py-1 text-xs font-medium",
                  customDays.includes(day.value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
                onClick={() => toggleCustomDay(day.value)}
              >
                {t(`daysOfWeek.${day.label}`)}
              </button>
            ))}
          </div>
          {customDays.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {t('form.fields.customDays.error')}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('form.fields.duration.label')}</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="h-10 border-0 bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Select
            value={period}
            onValueChange={(value: "days" | "weeks" | "months") =>
              setPeriod(value)
            }
          >
            <SelectTrigger className="w-[120px] h-10 border-0 bg-muted focus:ring-0">
              <SelectValue placeholder={t('form.fields.duration.period.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">{t('form.fields.duration.period.days')}</SelectItem>
              <SelectItem value="weeks">{t('form.fields.duration.period.weeks')}</SelectItem>
              <SelectItem value="months">{t('form.fields.duration.period.months')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('form.fields.duration.description')}
        </p>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="reminder" className="text-sm font-medium">
            {t('form.fields.reminder.label')}
          </Label>
          <Switch
            id="reminder"
            checked={reminderEnabled}
            onCheckedChange={setReminderEnabled}
          />
        </div>

        {reminderEnabled && (
          <div className="pt-2">
            <Label htmlFor="reminderTime" className="text-sm font-medium">
              {t('form.fields.reminder.time.label')}
            </Label>
            <Input
              id="reminderTime"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="mt-1 h-10 border-0 bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        )}
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('form.buttons.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={frequency === "custom" && customDays.length === 0}
          className="bg-primary hover:bg-primary/90"
        >
          {initialHabit ? t('form.buttons.update') : t('form.buttons.create')}
        </Button>
      </DialogFooter>
    </form>
  );
};

const HabitItem = ({
  habit,
  onToggle,
  onEdit,
  onDelete,
  onViewDetails,
}: {
  habit: Habit;
  onToggle: (id: string, e?: React.MouseEvent) => void;
  onEdit: (habit: Habit, e?: React.MouseEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
  onViewDetails: (habit: Habit, e?: React.MouseEvent) => void;
}) => {
  const isCompletedToday = habit.completedDates.some((date) =>
    isSameDay(new Date(date), new Date())
  );

  const streak = calculateStreak(habit.completedDates);
  const shouldComplete = shouldCompleteToday(habit);

  return (
    <div
      className={cn(
        "group flex items-center p-3 transition-colors",
        isCompletedToday ? "bg-muted/30" : "hover:bg-muted/10",
        "border-b border-border/50 last:border-b-0"
      )}
    >
      <button
        onClick={(e) => onToggle(habit.id, e)}
        className="flex-shrink-0 mr-3"
        aria-label={
          isCompletedToday ? "Mark as incomplete" : "Mark as complete"
        }
      >
        {isCompletedToday ? (
          <div
            className="h-6 w-6 flex items-center justify-center text-white"
            style={{ backgroundColor: habit.color }}
          >
            <Check className="h-4 w-4" />
          </div>
        ) : (
          <div className="h-6 w-6 border-2 border-muted-foreground/30 flex items-center justify-center">
            <div
              className="h-3 w-3 opacity-0 group-hover:opacity-20 transition-opacity"
              style={{ backgroundColor: habit.color }}
            ></div>
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer">
        <div className="flex items-center">
          <span
            className="w-5 h-5 flex items-center justify-center mr-2 text-sm"
            style={{ color: habit.color }}
          >
            {habit.icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-medium truncate",
                isCompletedToday && "line-through text-muted-foreground"
              )}
            >
              {habit.name}
            </h3>
          </div>
        </div>

        {habit.description && (
          <p className="text-xs text-muted-foreground truncate mt-1 ml-7">
            {habit.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 ml-7">
          {streak > 0 && (
            <div className="text-xs flex items-center gap-1 text-orange-500">
              <Flame className="h-3 w-3" />
              <span>{streak}d</span>
            </div>
          )}
          {habit.frequency !== "daily" && (
            <div className="text-xs text-muted-foreground">
              {habit.frequency === "weekly" ? "Weekly" : "Custom"}
            </div>
          )}
          <div className="text-xs flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {habit.duration}x/{habit.period.slice(0, -1)}
          </div>
          {habit.reminderEnabled && (
            <div className="text-xs flex items-center gap-1 text-muted-foreground">
              <Bell className="h-3 w-3" />
              {habit.reminderTime}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => onViewDetails(habit, e)}
          className="h-8 w-8 flex-shrink-0 opacity-70 hover:opacity-100 hover:bg-muted/80"
          aria-label="View details"
        >
          <Info className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 opacity-50 hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => onEdit(habit, e)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(habit.id, e);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const HabitCalendar = ({ habit }: { habit: Habit }) => {
  const t = useTranslations('components.habitTracker');
  const [currentDate, setCurrentDate] = useState(new Date());
  const daysToShow = 7;

  const navigateDays = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - daysToShow);
    } else {
      newDate.setDate(newDate.getDate() + daysToShow);
    }
    setCurrentDate(newDate);
  };

  // Generate dates to display
  const dates = Array.from({ length: daysToShow }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - currentDate.getDay() + i);
    return date;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('details.calendar.title')}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateDays("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateDays("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 bg-muted/30 p-3">
        {dates.map((date) => {
          const isCompleted = habit.completedDates.some((completedDate) =>
            isSameDay(new Date(completedDate), date)
          );

          return (
            <TooltipProvider key={date.toISOString()}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {format(date, "EEE")}
                    </div>
                    <div
                      className={cn(
                        "w-8 h-8 flex items-center justify-center text-xs",
                        isToday(date) &&
                          !isCompleted &&
                          "border border-primary/50",
                        isCompleted ? "text-white" : "bg-muted/50"
                      )}
                      style={{
                        backgroundColor: isCompleted ? habit.color : undefined,
                      }}
                    >
                      {format(date, "d")}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{format(date, "PPP")}</p>
                  <p className="text-xs">
                    {isCompleted ? t('details.calendar.completed') : t('details.calendar.notCompleted')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

const HabitStats = ({ habit }: { habit: Habit }) => {
  const t = useTranslations('components.habitTracker');
  const today = startOfToday();

  // Calculate completion rate for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, i);
    return {
      date,
      completed: habit.completedDates.some((completedDate) =>
        isSameDay(new Date(completedDate), date)
      ),
    };
  }).reverse();

  const completedLast7Days = last7Days.filter((day) => day.completed).length;
  const completionRate = Math.round((completedLast7Days / 7) * 100);

  // Calculate current streak
  let currentStreak = 0;
  let i = 0;
  while (i < habit.completedDates.length) {
    const date = subDays(today, i);
    const isCompletedOnDate = habit.completedDates.some((completedDate) =>
      isSameDay(new Date(completedDate), date)
    );

    if (!isCompletedOnDate) break;
    currentStreak++;
    i++;
  }

  // Calculate longest streak
  let longestStreak = 0;
  let currentCount = 0;
  const sortedDates = [...habit.completedDates]
    .map((date) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime());

  for (let i = 0; i < sortedDates.length; i++) {
    if (
      i === 0 ||
      isSameDay(
        subDays(sortedDates[i], 1),
        sortedDates[i - 1]
      )
    ) {
      currentCount++;
    } else {
      currentCount = 1;
    }
    longestStreak = Math.max(longestStreak, currentCount);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">
            {t('details.stats.completionRate')}
          </div>
          <div className="text-2xl font-semibold">{completionRate}%</div>
          <div className="text-xs text-muted-foreground">
            {t('details.stats.lastSevenDays')}
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">
            {t('details.stats.currentStreak')}
          </div>
          <div className="text-2xl font-semibold flex items-center gap-1">
            {currentStreak}
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-xs text-muted-foreground">
            {t('details.stats.daysInARow')}
          </div>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium">
              {t('details.stats.weeklyProgress')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('details.stats.lastSevenDays')}
            </div>
          </div>
          <div className="text-sm">
            {completedLast7Days}/{last7Days.length} {t('details.stats.daysCompleted')}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {last7Days.map((day) => (
            <TooltipProvider key={day.date.toISOString()}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {format(day.date, "EEE")}
                    </div>
                    <div
                      className={cn(
                        "w-8 h-8 flex items-center justify-center text-xs",
                        isToday(day.date) &&
                          !day.completed &&
                          "border border-primary/50",
                        day.completed ? "text-white" : "bg-muted/50"
                      )}
                      style={{
                        backgroundColor: day.completed ? habit.color : undefined,
                      }}
                    >
                      {format(day.date, "d")}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{format(day.date, "PPP")}</p>
                  <p className="text-xs">
                    {day.completed ? t('details.calendar.completed') : t('details.calendar.notCompleted')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="text-sm text-muted-foreground mb-1">
          {t('details.stats.longestStreak')}
        </div>
        <div className="text-2xl font-semibold flex items-center gap-1">
          {longestStreak}
          <Sparkles className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="text-xs text-muted-foreground">
          {t('details.stats.daysInARow')}
        </div>
      </div>
    </div>
  );
};

const HabitDetail = ({
  habit,
  onClose,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}) => {
  const t = useTranslations('components.habitTracker');
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className="w-8 h-8 flex items-center justify-center mr-3"
            style={{ backgroundColor: habit.color, color: "#fff" }}
          >
            <span className="text-base">{habit.icon}</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{habit.name}</h2>
            {habit.description && (
              <p className="text-sm text-muted-foreground">
                {habit.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(habit)}
            className="flex items-center"
          >
            <Edit className="h-4 w-4 mr-1" />
            <span>{t('details.buttons.edit')}</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete(habit.id);
              onClose();
            }}
            className="flex items-center bg-red-500 hover:bg-red-600 text-white"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span>{t('details.buttons.delete')}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-muted text-foreground hover:bg-muted">
          {CATEGORIES[habit.category].icon} {t(`categories.${CATEGORIES[habit.category].label}`)}
        </Badge>

        <Badge variant="outline">
          {habit.frequency === "daily" && t('form.fields.frequency.options.daily')}
          {habit.frequency === "weekly" && t('form.fields.frequency.options.weekly')}
          {habit.frequency === "custom" && t('form.fields.frequency.options.custom')}
        </Badge>

        <Badge variant="outline" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {habit.duration} {habit.duration === 1 ? t('form.fields.duration.period.days').slice(0, -1) : t('form.fields.duration.period.days')} per{" "}
          {t(`form.fields.duration.period.${habit.period}`).toLowerCase()}
        </Badge>

        {habit.reminderEnabled && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {habit.reminderTime}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger
            value="calendar"
            className="flex items-center gap-1 data-[state=active]:bg-background"
          >
            <Calendar className="h-4 w-4" />
            {t('details.calendar.title')}
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex items-center gap-1 data-[state=active]:bg-background"
          >
            <BarChart3 className="h-4 w-4" />
            {t('details.stats.title')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="pt-4">
          <HabitCalendar habit={habit} />
        </TabsContent>
        <TabsContent value="stats" className="pt-4">
          <HabitStats habit={habit} />
        </TabsContent>
      </Tabs>

      <div className="pt-4">
        <Button onClick={onClose} className="w-full">
          {t('details.buttons.close')}
        </Button>
      </div>
    </div>
  );
};

export function HabitTracker() {
  const t = useTranslations('components.habitTracker');
  const locale = useLocale();

  // Get the appropriate locale object
  const dateLocale = locale === 'pt' ? ptBR : enUS;

  // Adding error handling for useMeasureWidth
  useEffect(() => {
    // Capture errors that may occur during rendering
    const handleError = (event: ErrorEvent) => {
      // Ignore errors related to useMeasureWidth
      const errorText = event.message;
      if (
        errorText.includes("useMeasureWidth") ||
        errorText.includes("next-logo") ||
        errorText.includes("dev-tools-indicator")
      ) {
        return;
      }
      console.error("Error in useEffect:", event.error);
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "today" | HabitCategory
  >("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [lastReminderCheck, setLastReminderCheck] = useState<Date>(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const initialLoadComplete = useRef(false);

  // Load habits from local storage - ONLY ON FIRST MOUNT
  useEffect(() => {
    if (initialLoadComplete.current) return;

    const savedHabits = localStorage.getItem(STORAGE_KEY);
    if (savedHabits) {
      try {
        const parsedHabits = JSON.parse(savedHabits);
        if (parsedHabits && Array.isArray(parsedHabits)) {
          setHabits(parsedHabits);
        }
      } catch (error) {
        console.error("Failed to parse saved habits:", error);
      }
    }

    initialLoadComplete.current = true;
  }, []);

  // Save habits to local storage
  useEffect(() => {
    // Only save if initial load is done to prevent overwriting with empty array on first mount
    if (initialLoadComplete.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    }
  }, [habits]);

  // Check for habit reminders periodically (every minute)
  useEffect(() => {
    // Function to check if a habit should have a reminder sent
    const checkHabitReminders = async () => {
      const now = new Date();

      // Don't update state here to avoid render loop
      // Check if enough time has passed since last check
      if (now.getTime() - lastReminderCheck.getTime() < 30000) {
        return; // Exit early if we checked recently (last 30 seconds)
      }

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Get notification settings to see if notifications are enabled
      const settings = getNotificationSettings();

      // If notifications are disabled globally or for habits, just update last check time
      if (!settings.enabled || !settings.habitReminders) {
        setLastReminderCheck(now);
        return;
      }

      // Check all habits that have reminders enabled
      for (const habit of habits) {
        if (
          habit.reminderEnabled &&
          habit.reminderTime &&
          shouldCompleteToday(habit)
        ) {
          try {
            const [hourStr, minuteStr] = habit.reminderTime.split(":");
            const reminderHour = Number.parseInt(hourStr, 10);
            const reminderMinute = Number.parseInt(minuteStr, 10);

            // Check if within time window for notification (up to 1 minute after)
            if (
              (currentHour === reminderHour &&
                currentMinute === reminderMinute) ||
              (currentHour === reminderHour &&
                currentMinute === reminderMinute + 1)
            ) {
              // Avoid sending the same notification multiple times
              const reminderKey = `reminder_sent_${
                habit.id
              }_${now.toDateString()}`;
              const alreadySent = localStorage.getItem(reminderKey);

              if (!alreadySent) {
                // Send notification and mark as sent
                await sendHabitReminderNotification(habit.name);
                localStorage.setItem(reminderKey, "true");

                // Clear the marker after 2 minutes to avoid duplicate sending
                setTimeout(() => {
                  localStorage.removeItem(reminderKey);
                }, 120000);
              }
            }
          } catch (error) {
            console.error("Error processing habit reminder:", error);
          }
        }
      }

      // Update last check time after processing all habits
      setLastReminderCheck(now);
    };

    // Check immediately on component mount
    checkHabitReminders();

    // Set up interval to check every 30 seconds
    const intervalId = setInterval(checkHabitReminders, 30000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [habits, lastReminderCheck, shouldCompleteToday]);

  // Listen for notification settings changes
  useEffect(() => {
    const handleNotificationSettingsChange = (
      e: CustomEvent<NotificationSettings>
    ) => {
      // Just log that the settings were updated
      // We don't trigger any action here because notification settings
      // will be used directly by methods that send notifications
    };

    window.addEventListener(
      "notification_settings_changed",
      handleNotificationSettingsChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "notification_settings_changed",
        handleNotificationSettingsChange as EventListener
      );
    };
  }, []); // Empty dependency array to ensure we only add the listener once

  // Handle creating a new habit
  const handleCreateHabit = (
    habitData: Omit<Habit, "id" | "createdAt" | "completedDates">
  ) => {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completedDates: [],
      duration: habitData.duration || 1,
      period: habitData.period || "days",
      reminderEnabled: habitData.reminderEnabled || false,
      reminderTime: habitData.reminderEnabled && habitData.reminderTime ? habitData.reminderTime : undefined,
    };

    setHabits([...habits, newHabit]);
    setIsAddDialogOpen(false);

    toast({
      title: t('notifications.created.title'),
      description: t('notifications.created.description', { name: newHabit.name }),
    });
  };

  // Handle updating a habit
  const handleUpdateHabit = (
    habitData: Omit<Habit, "id" | "createdAt" | "completedDates">
  ) => {
    if (!selectedHabit) return;

    const updatedHabit: Habit = {
      ...selectedHabit,
      ...habitData,
    };

    setHabits(
      habits.map((habit) =>
        habit.id === selectedHabit.id ? updatedHabit : habit
      )
    );

    setIsEditDialogOpen(false);
    setSelectedHabit(null);

    toast({
      title: t('notifications.updated.title'),
      description: t('notifications.updated.description', { name: updatedHabit.name }),
    });
  };

  // Handle toggling a habit completion
  const handleToggleHabit = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    setHabits(
      habits.map((habit) => {
        if (habit.id !== id) return habit;

        const today = new Date().toISOString().split("T")[0];
        const isCompletedToday = habit.completedDates.some((date) =>
          date.startsWith(today)
        );

        // Add haptic feedback if supported
        if ("vibrate" in navigator) {
          try {
            navigator.vibrate(isCompletedToday ? 20 : 40);
          } catch (error) {
            console.error("Failed to vibrate:", error);
          }
        }

        // Play sound effect (optional)
        try {
          const soundEffect = new Audio(
            isCompletedToday
              ? "/sounds/things/pop-down.mp3"
              : "/sounds/things/pop-up.mp3"
          );
          soundEffect.volume = 0.2;
          soundEffect.play().catch((err) => {
            // Ignore autoplay errors, they're expected if user hasn't interacted yet
            console.log("Sound could not be played automatically");
          });
        } catch (error) {
          console.error("Failed to play sound:", error);
        }

        if (isCompletedToday) {
          // Remove today's completion
          return {
            ...habit,
            completedDates: habit.completedDates.filter(
              (date) => !date.startsWith(today)
            ),
          };
        } else {
          // Add today's completion with a small toast notification
          toast({
            title: t('notifications.completed.title'),
            description: t('notifications.completed.description', { name: habit.name }),
            duration: 1500,
          });

          return {
            ...habit,
            completedDates: [...habit.completedDates, new Date().toISOString()],
          };
        }
      })
    );
  };

  // Handle deleting a habit
  const handleDeleteHabit = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const habitToDelete = habits.find((habit) => habit.id === id);
    if (!habitToDelete) return;

    // Store the habit to delete
    setSelectedHabit(habitToDelete);

    // Close any open dialogs
    setIsDetailDialogOpen(false);
    setIsEditDialogOpen(false);

    // Open delete confirmation dialog
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteHabit = () => {
    if (!selectedHabit) {
      setIsDeleteDialogOpen(false);
      return;
    }

    const habitId = selectedHabit.id;
    const habitName = selectedHabit.name;

    // Update the habits state
    const updatedHabits = habits.filter((habit) => habit.id !== habitId);
    setHabits(updatedHabits);

    // Ensure the habit is persisted to localStorage immediately
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHabits));
    }, 0);

    // Show success toast
    toast({
      title: t('notifications.deleted.title'),
      description: t('notifications.deleted.description', { name: habitName }),
    });

    // Close the dialog and clear selected habit
    setIsDeleteDialogOpen(false);
    setSelectedHabit(null);
  };

  // Handle editing a habit
  const handleEditHabit = (habit: Habit, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    setSelectedHabit(habit);
    setIsEditDialogOpen(true);
  };

  // Filter habits based on active filter
  const filteredHabits = habits.filter((habit) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "today") return shouldCompleteToday(habit);
    return habit.category === activeFilter;
  });

  // Calculate completion stats
  const completedToday = habits.filter((habit) =>
    habit.completedDates.some((date) => isSameDay(new Date(date), new Date()))
  ).length;

  const totalForToday = habits.filter((habit) =>
    shouldCompleteToday(habit)
  ).length;

  const completionPercentage =
    totalForToday > 0 ? Math.round((completedToday / totalForToday) * 100) : 0;

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-xs text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d", { locale: dateLocale })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("h-8 w-8", showFilters && "bg-muted")}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                {t('form.buttons.create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md overflow-y-auto max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>{t('form.title.new')}</DialogTitle>
                <DialogDescription>
                  {t('form.description')}
                </DialogDescription>
              </DialogHeader>
              <HabitForm
                onSave={handleCreateHabit}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {showFilters && (
        <div className="p-3 bg-muted/30 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className="h-7 text-xs"
            >
              {t('all')}
            </Button>
            <Button
              variant={activeFilter === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("today")}
              className="h-7 text-xs"
            >
              {t('today')}
            </Button>

            {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
              <Button
                key={key}
                variant={activeFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(key as HabitCategory)}
                className="h-7 text-xs"
              >
                <span className="mr-1">{icon}</span>
                {t(`categories.${label}`)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {totalForToday > 0 && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-sm font-medium">{t('todayProgress.title')}</div>
            <div className="text-sm">
              {completedToday}/{totalForToday}
            </div>
          </div>
          <Progress value={completionPercentage} className="h-1.5" />
        </div>
      )}

      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div className="bg-muted/50 rounded-full p-3 mb-4">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">{t('noHabits.title')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('noHabits.description')}
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('noHabits.action')}
          </Button>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
          <p className="text-muted-foreground mb-2">
            {t('noMatchingHabits.description')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveFilter("all")}
          >
            {t('noMatchingHabits.action')}
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {filteredHabits.map((habit) => (
            <div key={habit.id}>
              <HabitItem
                habit={habit}
                onToggle={handleToggleHabit}
                onEdit={handleEditHabit}
                onDelete={handleDeleteHabit}
                onViewDetails={(habit, e) => {
                  if (e) e.stopPropagation();
                  setSelectedHabit(habit);
                  setIsDetailDialogOpen(true);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t('form.title.edit')}</DialogTitle>
            <DialogDescription>{t('form.description')}</DialogDescription>
          </DialogHeader>
          {selectedHabit && (
            <HabitForm
              initialHabit={selectedHabit}
              onSave={handleUpdateHabit}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedHabit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t('details.title')}</DialogTitle>
          </DialogHeader>
          {selectedHabit && (
            <HabitDetail
              habit={selectedHabit}
              onClose={() => {
                setIsDetailDialogOpen(false);
                setSelectedHabit(null);
              }}
              onEdit={(habit) => {
                setIsDetailDialogOpen(false);
                setSelectedHabit(habit);
                setIsEditDialogOpen(true);
              }}
              onDelete={handleDeleteHabit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen && selectedHabit !== null}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setSelectedHabit(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedHabit && t('deleteConfirm.description', { name: selectedHabit.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteHabit();
              }}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
