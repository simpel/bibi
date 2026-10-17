import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@okazi/ui";
import { CheckIcon, SunMoonIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

const THEMES = [
  { value: "light", labelKey: "themeLight" },
  { value: "dark", labelKey: "themeDark" },
  { value: "system", labelKey: "themeSystem" },
] as const;

/** User-menu submenu: light / dark / system; next-themes toggles the `dark` class on <html>. */
export function ThemeMenu() {
  const t = useTranslations("shell");
  const common = useTranslations("common");
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <SunMoonIcon />
        {common("theme")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {THEMES.map(({ value, labelKey }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <span className="flex-1">{t(labelKey)}</span>
            {theme === value ? <CheckIcon /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
