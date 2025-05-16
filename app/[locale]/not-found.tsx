"use client";

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/" passHref>
            <Button className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              <span>{t('backToHome')}</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
