"use client";

import type { NotificationKind, NotificationPreferenceDto } from "@bibi/core/schemas";
import { Label, Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { setNotificationPreferenceAction } from "../actions";

export type NotificationPreferencesProps = { preferences: NotificationPreferenceDto[] };

/** One switch per kind of notification (ADR 0094); each saves on change. */
export function NotificationPreferences({ preferences }: NotificationPreferencesProps) {
  const t = useTranslations("notifications.preferences");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const change = ({ kind, enabled }: { kind: NotificationKind; enabled: boolean }) =>
    run({
      action: () => setNotificationPreferenceAction({ kind, enabled }),
      messages: { pending: common("saving"), success: enabled ? t("turnedOn") : t("turnedOff") },
      onSuccess: () => router.refresh(),
    });
  return (
    <ul className="grid max-w-xl gap-4">
      {preferences.map(({ kind, enabled }) => (
        <li key={kind} className="flex items-center justify-between gap-4">
          <Label htmlFor={`notification-${kind}`}>{t(kind)}</Label>
          <Switch
            id={`notification-${kind}`}
            checked={enabled}
            disabled={pending}
            onCheckedChange={(checked) => change({ kind, enabled: checked })}
          />
        </li>
      ))}
    </ul>
  );
}
