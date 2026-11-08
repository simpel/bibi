import { LOCALES, type Locale } from "@bibi/i18n";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@bibi/ui";
import { CheckIcon, LanguagesIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { saveProfileLocale } from "@/features/profile/actions";
import { usePathname, useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";

const LABEL_KEY = { sv: "languageSv", en: "languageEn" } as const;

/**
 * User-menu submenu: saves the language on the profile (pending → outcome toast), then switches the
 * URL locale prefix (sv/en), keeping the path and query.
 */
export function LocaleMenu() {
  const t = useTranslations("shell");
  const common = useTranslations("common");
  const current = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const href = query ? `${pathname}?${query}` : pathname;

  const { run } = useToastAction();
  const handleSelect = ({ locale }: { locale: Locale }) =>
    run({
      action: () => saveProfileLocale({ locale }),
      messages: { pending: common("saving"), success: t("languageSaved") },
      onSuccess: () => router.replace(href, { locale }),
    });

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <LanguagesIcon />
        {common("language")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {LOCALES.map((locale) => (
          <DropdownMenuItem key={locale} onSelect={() => handleSelect({ locale })}>
            <span className="flex-1">{t(LABEL_KEY[locale])}</span>
            {locale === current ? <CheckIcon /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
