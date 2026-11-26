import type { LifecycleKind } from "@/features/lifecycle/lifecycle-kinds";

/** One archived record on the Archive page, its dates already written on the server. */
export type ArchivedRow = {
  kind: LifecycleKind;
  id: string;
  name: string;
  archivedLabel: string;
  archivedMs: number;
  deletesLabel: string;
  deletesMs: number;
};
