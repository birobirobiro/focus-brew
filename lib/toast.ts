/**
 * Standardized toast notifications using sonner library
 */

import { toast as sonnerToast } from "sonner";
import { useTranslations } from 'next-intl';

// We're using the sonner library directly without a wrapper
// This file provides a convenient centralized import

// Re-export everything from sonner
export const toast = sonnerToast;

/**
 * Helper function to show an appropriate toast based on browser notification permission status
 */
export const useNotificationPermissionToast = () => {
  const t = useTranslations('components.toast.notifications');

  return (permission: NotificationPermission) => {
    switch (permission) {
      case "granted":
        toast.success(t('enabled.title'), {
          description: t('enabled.description'),
        });
        break;
      case "denied":
        toast.error(t('blocked.title'), {
          description: t('blocked.description'),
        });
        break;
      case "default":
        toast.info(t('permission.title'), {
          description: t('permission.description'),
        });
        break;
    }
  };
};
