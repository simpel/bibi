"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { authClient } from "@/lib/auth-client";
import { SessionNotFresh } from "./session-not-fresh";
import type { SessionRow } from "./session-row";
import { useAuthFormAction } from "./use-auth-form-action";
import { useSessionColumns } from "./use-session-columns";

function useSessions() {
  const t = useTranslations("profile");
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [stale, setStale] = useState(false);
  const { pending, run } = useAuthFormAction();
  const [asking, setAsking] = useState(false);
  const load = useCallback(async () => {
    try {
      const { data, error } = await authClient.listSessions();
      // Better Auth lists sessions only for a sign-in younger than its fresh age (a day).
      setStale(error?.code === "SESSION_NOT_FRESH");
      setFailed(Boolean(error) && error?.code !== "SESSION_NOT_FRESH");
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
      onSuccess: () => {
        setAsking(false);
        void load();
      },
    });
  return { rows: rows ?? [], failed, stale, pending, signOutOthers, asking, setAsking };
}

/** Active sessions of the signed-in user, with "sign out of all others" (asks first). */
export function ProfileSessions() {
  const t = useTranslations("profile");
  const current = authClient.useSession().data?.session.id;
  const { rows, failed, stale, pending, signOutOthers, asking, setAsking } = useSessions();
  const columns = useSessionColumns({ current });
  if (stale) return <SessionNotFresh />;
  const others = rows.filter((row) => row.id !== current);
  return (
    <div className="grid gap-4">
      <InlineLoadError errorKey={failed ? "generic" : null} />
      <PersistedDataTable
        tableId="profile.sessions"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        emptyText={t("sessionsEmpty")}
      />
      <Button
        type="button"
        variant="outline"
        disabled={pending || others.length === 0}
        onClick={() => setAsking(true)}
        className="justify-self-start"
      >
        {t("signOutOthers")}
      </Button>
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title={t("signOutOthersTitle")}
        description={t("signOutOthersDescription", { count: others.length })}
        confirmLabel={t("signOutOthers")}
        pending={pending}
        onConfirm={signOutOthers}
      />
    </div>
  );
}
