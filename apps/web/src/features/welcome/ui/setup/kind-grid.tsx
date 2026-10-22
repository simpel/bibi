"use client";

import { getSetupPreset, SETUP_PRESET_KEYS, type SetupPresetKey } from "@bibi/core/setup-presets";
import { Button, cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { draftFromKind } from "../../lib/setup-draft";
import { welcomePath } from "../../lib/welcome-step";
import { useSetupDraft } from "./setup-draft-provider";
import { useTypeLabel } from "./use-type-label";

const GRID_KINDS = SETUP_PRESET_KEYS.filter((key) => key !== "empty");

/** The 3×3 grid of venue kinds; picking one prefills the type steps (ADR 0061). */
export function KindGrid() {
  const t = useTranslations("welcome");
  const router = useRouter();
  const label = useTypeLabel();
  const { org, draft, setDraft } = useSetupDraft();
  const pick = ({ key }: { key: SetupPresetKey }) => {
    const same = draft.kind === key;
    if (!same) setDraft({ draft: draftFromKind({ preset: getSetupPreset({ key }), label }) });
    const step = key === "empty" ? "setup/review" : "setup/bookable";
    router.push(welcomePath({ step }), { org });
  };
  return (
    <div className="grid gap-4">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GRID_KINDS.map((key) => (
          <li key={key}>
            <button
              type="button"
              aria-pressed={draft.kind === key}
              onClick={() => pick({ key })}
              className={cn(
                "grid h-full w-full gap-1 rounded-lg border bg-card p-4 text-left transition-colors",
                "hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                draft.kind === key && "border-primary ring-1 ring-primary",
              )}
            >
              <span className="font-medium">{t(`kinds.${key}.name`)}</span>
              <span className="text-sm text-muted-foreground">{t(`kinds.${key}.example`)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex justify-center">
        <Button type="button" variant="link" onClick={() => pick({ key: "empty" })}>
          {t("setup.kind.startEmpty")}
        </Button>
      </div>
    </div>
  );
}
