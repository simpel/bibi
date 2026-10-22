"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { MagicLinkForm } from "./magic-link-form";
import { OtpForm } from "./otp-form";
import { PasswordLoginForm } from "./password-login-form";

export type LoginTabsProps = { next: string };

/** Sign-in methods: email + password, magic link, one-time code. */
export function LoginTabs({ next }: LoginTabsProps) {
  const t = useTranslations("auth");
  return (
    <Tabs defaultValue="password" className="grid gap-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="password">{t("tabPassword")}</TabsTrigger>
        <TabsTrigger value="magic-link">{t("tabMagicLink")}</TabsTrigger>
        <TabsTrigger value="code">{t("tabCode")}</TabsTrigger>
      </TabsList>
      <TabsContent value="password">
        <PasswordLoginForm next={next} />
      </TabsContent>
      <TabsContent value="magic-link">
        <MagicLinkForm next={next} />
      </TabsContent>
      <TabsContent value="code">
        <OtpForm next={next} />
      </TabsContent>
    </Tabs>
  );
}
