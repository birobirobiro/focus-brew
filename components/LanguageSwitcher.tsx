'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '../i18n/routing';
import { Button } from './ui/button';
import { Languages, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const switchLocale = async () => {
    setIsLoading(true);
    const nextLocale = locale === 'en' ? 'pt' : 'en';

    await new Promise(resolve => setTimeout(resolve, 500));
    
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-300"
      onClick={switchLocale}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Languages className="h-4 w-4" />
      )}
      <span className="hidden md:inline">
        {locale === 'en' ? 'PT' : 'EN'}
      </span>
    </Button>
  );
} 