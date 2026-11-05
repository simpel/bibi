"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { MagicLinkForm } from "./magic-link-form";
import { PasswordLoginForm } from "./password-login-form";

export type LoginTabsProps = { next: string };

/** Sign-in methods: magic link (default) and email + password. */
export function LoginTabs({ next }: LoginTabsProps) {
  const t = useTranslations("auth");
  return (
    <Tabs defaultValue="magic-link" className="grid gap-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="magic-link">{t("tabMagicLink")}</TabsTrigger>
        <TabsTrigger value="password">{t("tabPassword")}</TabsTrigger>
      </TabsList>
      <TabsContent value="magic-link">
        <MagicLinkForm next={next} />
      </TabsContent>
      <TabsContent value="password">
        <PasswordLoginForm next={next} />
      </TabsContent>
    </Tabs>
  );
}
