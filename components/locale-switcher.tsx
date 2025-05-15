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

export default function LocaleSwitcher() {
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
      <SelectTrigger className="w-[120px] h-6 text-xs">
        <SelectValue placeholder={t('label')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en" className="text-xs">
          {t('languages.en')}
        </SelectItem>
        <SelectItem value="pt" className="text-xs">
          {t('languages.pt')}
        </SelectItem>
      </SelectContent>
    </Select>
  );
} 