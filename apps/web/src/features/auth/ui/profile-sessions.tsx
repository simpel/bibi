"use client";

import { Badge, Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { authClient } from "@/lib/auth-client";
import { useAuthFormAction } from "./use-auth-form-action";

type SessionRow = {
  id: string;
  token: string;
  userAgent?: string | null;
  createdAt: Date | string;
};

function useSessions() {
  const t = useTranslations("profile");
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const { pending, run } = useAuthFormAction();
  const load = useCallback(async () => {
    try {
      const { data, error } = await authClient.listSessions();
      setFailed(Boolean(error));
      if (data) setRows(data as SessionRow[]);
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const signOutOthers = () =>
    run({
      call: () => authClient.revokeOtherSessions(),
      messages: { pending: t("signingOutOthers"), success: t("signedOutOthers") },
      onSuccess: load,
    });
  return { rows: rows ?? [], failed, pending, signOutOthers };
}

/** Active sessions of the signed-in user, with "sign out of all others". */
export function ProfileSessions() {
  const t = useTranslations("profile");
  const current = authClient.useSession().data?.session.id;
  const { rows, failed, pending, signOutOthers } = useSessions();
  const others = rows.filter((row) => row.id !== current);
  return (
    <div className="grid gap-4">
      <InlineLoadError errorKey={failed ? "generic" : null} />
      <ul className="grid gap-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate">{row.userAgent || t("unknownDevice")}</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              {new Date(row.createdAt).toLocaleString()}
              {row.id === current ? <Badge>{t("thisSession")}</Badge> : null}
            </span>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        disabled={pending || others.length === 0}
        onClick={signOutOthers}
        className="justify-self-start"
      >
        {t("signOutOthers")}
      </Button>
    </div>
  );
}
