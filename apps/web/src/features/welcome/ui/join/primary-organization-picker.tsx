"use client";

import type { JoinableOrganizations } from "@bibi/auth";
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { finishJoiningAction } from "../../join-actions";

type Memberships = JoinableOrganizations["memberships"];

/** The primary organization, where new sessions start (ADR 0076), then on into it. */
export function PrimaryOrganizationPicker({ memberships }: { memberships: Memberships }) {
  const t = useTranslations("welcome.join");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const initial = memberships.find((m) => m.primary) ?? memberships[0];
  const [chosen, setChosen] = useState(initial?.organizationId ?? "");
  const target = memberships.find((m) => m.organizationId === chosen) ?? initial;
  if (!target) return null;
  const finish = () =>
    run({
      action: () => finishJoiningAction({ input: { organizationId: target.organizationId } }),
      messages: { pending: t("finishing"), success: t("finished", { organization: target.name }) },
      onSuccess: () => router.push(ROUTES.welcome, { org: target.slug }),
    });
  return (
    <div className="grid gap-4">
      {memberships.length > 1 ? (
        <div className="grid gap-2">
          <Label htmlFor="primary-organization">{t("primary")}</Label>
          <Select value={chosen} onValueChange={setChosen}>
            <SelectTrigger id="primary-organization" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {memberships.map((m) => (
                <SelectItem key={m.organizationId} value={m.organizationId}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{t("primaryHint")}</p>
        </div>
      ) : null}
      <Button type="button" disabled={pending} onClick={finish}>
        {t("continue", { organization: target.name })}
      </Button>
    </div>
  );
}
