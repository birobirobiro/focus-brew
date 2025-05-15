'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  size?: 'sm' | 'default'
}

export default function LocaleSwitcher({ size = 'default' }: LocaleSwitcherProps) {
  const t = useTranslations('components.localeSwitcher');
  const pathname = usePathname();
  const router = useRouter();

  // Get current locale from pathname
  const currentLocale = pathname.split('/')[1] || 'en';

  function onSelectChange(value: string) {
    const newPathname = pathname.replace(/^\/[a-z]{2}/, `/${value}`);
    router.push(newPathname);
  }

  return (
    <Select defaultValue={currentLocale} onValueChange={onSelectChange}>
      <SelectTrigger 
        className={cn(
          size === 'default' ? 'w-[130px] h-9 text-sm' : 'w-[100px] h-5 text-xs'
        )}
      >
        <SelectValue placeholder={t('label')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en" className={size === 'default' ? 'text-sm' : 'text-xs'}>
          {t('languages.en')}
        </SelectItem>
        <SelectItem value="pt" className={size === 'default' ? 'text-sm' : 'text-xs'}>
          {t('languages.pt')}
        </SelectItem>
      </SelectContent>
    </Select>
  );
} 