import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { NotificationSettings } from "./notification-settings";
import { VolumeSettings } from "./volume-settings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/toast";
import { useTranslations } from 'next-intl';

export function SettingsGeneralTab() {
  const t = useTranslations('components.settings.general');

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();

    toast.success(t('reset.success.title'), {
      description: t('reset.success.description'),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('permissions.title')}</CardTitle>
          <CardDescription>{t('permissions.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationSettings />
        </CardContent>
      </Card>

      <VolumeSettings />

      <Card>
        <CardHeader>
          <CardTitle>{t('reset.title')}</CardTitle>
          <CardDescription>{t('reset.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">{t('reset.button')}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('reset.confirm.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('reset.confirm.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('reset.confirm.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('reset.confirm.action')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
