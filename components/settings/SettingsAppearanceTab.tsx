"use client";

import { motion } from "framer-motion";
import {
  ChevronsUpDown,
  Check,
  ArrowRightLeft,
  Sun,
  Moon,
  Monitor,
  Thermometer,
  Coins,
  Type,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTranslations } from 'next-intl';

interface Props {
  font: string;
  setFont: (font: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  setSystemTheme: (theme: string) => void;
  base: string;
  setBase: (base: string) => void;
  target: string;
  setTarget: (target: string) => void;
  currencies: string[];
  openBase: boolean;
  setOpenBase: (open: boolean) => void;
  openTarget: boolean;
  setOpenTarget: (open: boolean) => void;
  baseSearch: string;
  setBaseSearch: (s: string) => void;
  targetSearch: string;
  setTargetSearch: (s: string) => void;
  filteredBase: string[];
  filteredTarget: string[];
}

const fonts = [
  { value: "font-satoshi", label: "Satoshi (Default)" },
  { value: "font-sans", label: "Nunito" },
  { value: "font-serif", label: "Roboto Slab" },
  { value: "font-mono", label: "Monospace" },
  { value: "font-general-sans", label: "General Sans" },
  { value: "font-geist", label: "Geist" },
  { value: "font-chillax", label: "Chillax" },
  { value: "font-sentient", label: "Sentient" },
  { value: "font-gambetta", label: "Gambetta" },
];

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const temperatureUnits = [
  { value: "C", label: "Celsius (°C)" },
  { value: "F", label: "Fahrenheit (°F)" },
];

type TemperatureUnit = "C" | "F";

export function SettingsAppearanceTab({
  font,
  setFont,
  theme,
  setTheme,
  setSystemTheme,
  base,
  setBase,
  target,
  setTarget,
  currencies,
  openBase,
  setOpenBase,
  openTarget,
  setOpenTarget,
  baseSearch,
  setBaseSearch,
  targetSearch,
  setTargetSearch,
  filteredBase,
  filteredTarget,
}: Props) {
  const t = useTranslations('components.settings.appearance');
  
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(
    () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("weather_unit");
        if (stored === "C" || stored === "F") {
          return stored;
        }
      }
      return "C";
    }
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("weather_unit", temperatureUnit);
      window.dispatchEvent(
        new CustomEvent("temperature_unit_changed", {
          detail: temperatureUnit,
        })
      );
    }
  }, [temperatureUnit]);

  const handleTemperatureUnitChange = (value: string) => {
    if (value === "C" || value === "F") {
      setTemperatureUnit(value);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-border/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">{t('theme.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('theme.description')}
                </p>
              </div>
            </div>
            <RadioGroup
              value={theme}
              onValueChange={(value) => {
                setTheme(value);
                if (typeof window !== "undefined") {
                  document.documentElement.classList.remove("light", "dark");
                  if (value !== "system") {
                    document.documentElement.classList.add(value);
                  }
                }
              }}
              className="flex flex-wrap gap-2"
            >
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                return (
                  <Label
                    key={themeOption.value}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors",
                      theme === themeOption.value
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <RadioGroupItem
                      value={themeOption.value}
                      id={`theme-${themeOption.value}`}
                      className="sr-only"
                    />
                    <Icon className="h-4 w-4" />
                    <span>{t(`theme.options.${themeOption.value}`)}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border-border/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Thermometer className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">{t('temperature.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('temperature.description')}
                </p>
              </div>
            </div>
            <RadioGroup
              value={temperatureUnit}
              onValueChange={handleTemperatureUnitChange}
              className="flex flex-wrap gap-2"
            >
              {temperatureUnits.map((unit) => (
                <Label
                  key={unit.value}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors",
                    temperatureUnit === unit.value
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <RadioGroupItem
                    value={unit.value}
                    id={`unit-${unit.value}`}
                    className="sr-only"
                  />
                  <span>{t(`temperature.units.${unit.value}`)}</span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border-border/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Coins className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">{t('currency.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('currency.description')}
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Popover open={openBase} onOpenChange={setOpenBase}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-28 justify-between border rounded-lg px-3 py-2 bg-background text-sm flex items-center transition-colors",
                      !base && "text-muted-foreground",
                      openBase && "border-primary/50",
                      "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    )}
                    role="combobox"
                    aria-expanded={openBase}
                  >
                    {base ? base.toUpperCase() : t('currency.base.placeholder')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-36 p-0"
                  align="start"
                  sideOffset={5}
                  side="bottom"
                  forceMount
                >
                  <div className="overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
                    <div className="flex items-center border-b px-3">
                      <input
                        value={baseSearch}
                        onChange={(e) => setBaseSearch(e.target.value)}
                        placeholder={t('currency.search')}
                        className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      {filteredBase.length === 0 ? (
                        <div className="py-6 text-center text-sm">
                          {t('currency.noResults')}
                        </div>
                      ) : (
                        filteredBase.map((cur) => (
                          <div
                            key={cur}
                            className={cn(
                              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                              "hover:bg-accent hover:text-accent-foreground",
                              base === cur && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => {
                              setBase(cur);
                              setOpenBase(false);
                              setBaseSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                base === cur ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cur.toUpperCase()}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />

              <Popover open={openTarget} onOpenChange={setOpenTarget}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-28 justify-between border rounded-lg px-3 py-2 bg-background text-sm flex items-center transition-colors",
                      !target && "text-muted-foreground",
                      openTarget && "border-primary/50",
                      "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    )}
                    role="combobox"
                    aria-expanded={openTarget}
                  >
                    {target ? target.toUpperCase() : t('currency.target.placeholder')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-36 p-0"
                  align="start"
                  sideOffset={5}
                  side="bottom"
                  forceMount
                >
                  <div className="overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
                    <div className="flex items-center border-b px-3">
                      <input
                        value={targetSearch}
                        onChange={(e) => setTargetSearch(e.target.value)}
                        placeholder={t('currency.search')}
                        className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      {filteredTarget.length === 0 ? (
                        <div className="py-6 text-center text-sm">
                          {t('currency.noResults')}
                        </div>
                      ) : (
                        filteredTarget.map((cur) => (
                          <div
                            key={cur}
                            className={cn(
                              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                              "hover:bg-accent hover:text-accent-foreground",
                              target === cur &&
                                "bg-accent text-accent-foreground"
                            )}
                            onClick={() => {
                              setTarget(cur);
                              setOpenTarget(false);
                              setTargetSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                target === cur ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cur.toUpperCase()}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="border-border/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Type className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">{t('font.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('font.description')}
                </p>
              </div>
            </div>
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger className="w-[240px] bg-background/50 border-border/30">
                <SelectValue placeholder={t('font.placeholder')} />
              </SelectTrigger>
              <SelectContent className="bg-background/90 backdrop-blur-md border-border/30">
                {fonts.map((f) => (
                  <SelectItem key={f.value} value={f.value} className={f.value}>
                    {t(`font.options.${f.value}`, { defaultValue: f.label })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
