import { LOCALES } from "@bibi/i18n";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@bibi/ui";
import { CheckIcon, LanguagesIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/navigation";

const LABEL_KEY = { sv: "languageSv", en: "languageEn" } as const;

/** User-menu submenu: switches the URL locale prefix (sv/en), keeping the path and query. */
export function LocaleMenu() {
  const t = useTranslations("shell");
  const common = useTranslations("common");
  const current = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const href = query ? `${pathname}?${query}` : pathname;
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <LanguagesIcon />
        {common("language")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {LOCALES.map((locale) => (
          <DropdownMenuItem key={locale} onSelect={() => router.replace(href, { locale })}>
            <span className="flex-1">{t(LABEL_KEY[locale])}</span>
            {locale === current ? <CheckIcon /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
