"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@okazi/ui";
import { CheckIcon, LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { LOCALES } from "@okazi/i18n";

const LABEL_KEY = { sv: "languageSv", en: "languageEn" } as const;

/** Switches the URL locale prefix (sv/en), keeping the current path and query. */
export function LocaleSwitcher() {
  const t = useTranslations("shell");
  const common = useTranslations("common");
  const current = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const href = query ? `${pathname}?${query}` : pathname;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={common("language")}>
          <LanguagesIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((locale) => (
          <DropdownMenuItem key={locale} onSelect={() => router.replace(href, { locale })}>
            <span className="flex-1">{t(LABEL_KEY[locale])}</span>
            {locale === current ? <CheckIcon /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
