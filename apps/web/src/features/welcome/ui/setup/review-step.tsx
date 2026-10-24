"use client";

import { draftFromTypes } from "@bibi/core/pipeline-setup-templates";
import { getSetupPreset } from "@bibi/core/setup-presets";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { chosenTypes } from "../../lib/setup-draft";
import { welcomePath } from "../../lib/welcome-step";
import { activateSetupAction } from "../../setup-actions";
import { WelcomeStepActions } from "../welcome-step-actions";
import { ReviewLists } from "./review-lists";
import { ReviewPath } from "./review-path";
import { SkipSetupButton } from "./skip-setup-button";
import { useDraftGuard } from "./use-draft-guard";

/** Everything chosen, then Activate: the baseline is saved in one go (ADR 0061). */
export function ReviewStep({ organization }: { organization: string }) {
  const t = useTranslations("welcome");
  const router = useRouter();
  const { org, draft } = useDraftGuard();
  const { run, pending } = useToastAction();
  const types = chosenTypes({ draft });
  const statuses = getSetupPreset({ key: draft.kind ?? "empty" }).statuses;
  const pipeline = draftFromTypes({ statuses, types, existingTypes: [] });
  const activate = () =>
    run({
      action: () => activateSetupAction({ draft: pipeline }),
      messages: {
        pending: t("setup.review.activating", { organization }),
        success: t("activated", { organization }),
      },
      onSuccess: () => router.push(welcomePath({ step: "done" }), { org }),
    });
  const back = draft.kind === "empty" ? "setup/kind" : "setup/sellable";
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        activate();
      }}
    >
      <ReviewLists
        book={types.filter((type) => type.bookable).map((type) => type.name)}
        sell={types.filter((type) => !type.bookable).map((type) => type.name)}
      />
      <ReviewPath statuses={pipeline.statuses} />
      <WelcomeStepActions
        back={{ href: welcomePath({ step: back }), org }}
        pending={pending}
        label={t("setup.review.activate")}
        aside={<SkipSetupButton org={org} />}
      />
    </form>
  );
}
