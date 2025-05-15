"use client";

import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from 'next-intl';

export function SettingsAboutTab() {
  const t = useTranslations('components.settings.about');

  const features = [
    {
      title: t('features.ambient.title'),
      description: t('features.ambient.description'),
      icon: "🎵",
    },
    {
      title: t('features.dock.title'),
      description: t('features.dock.description'),
      icon: "🚀",
    },
    {
      title: t('features.exchange.title'),
      description: t('features.exchange.description'),
      icon: "💱",
    },
    {
      title: t('features.focusTimer.title'),
      description: t('features.focusTimer.description'),
      icon: "⏱️",
    },
    {
      title: t('features.kanban.title'),
      description: t('features.kanban.description'),
      icon: "📋",
    },
    {
      title: t('features.notes.title'),
      description: t('features.notes.description'),
      icon: "📝",
    },
    {
      title: t('features.settings.title'),
      description: t('features.settings.description'),
      icon: "⚙️",
    },
    {
      title: t('features.tasks.title'),
      description: t('features.tasks.description'),
      icon: "✅",
    },
    {
      title: t('features.habitTracker.title'),
      description: t('features.habitTracker.description'),
      icon: "🎯",
    },
    {
      title: t('features.weather.title'),
      description: t('features.weather.description'),
      icon: "🌤️",
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('title')}</h2>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {t('description')}
        </p>
      </motion.div>

      <Separator />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold">{t('featuresTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="text-2xl">{feature.icon}</div>
              <div>
                <h4 className="font-medium">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
