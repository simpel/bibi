"use client";

import { localizeDraft } from "@bibi/core/pipeline-setup-localize";
import { draftFromTypes } from "@bibi/core/pipeline-setup-templates";
import { getSetupPreset } from "@bibi/core/setup-presets";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { exampleOrdersInput } from "../../lib/example-orders";
import { categoryOf, chosenTypes } from "../../lib/setup-draft";
import { welcomePath } from "../../lib/welcome-step";
import { activateSetupAction } from "../../setup-actions";
import { WelcomeStepActions } from "../welcome-step-actions";
import { ReviewLists } from "./review-lists";
import { useDraftGuard } from "./use-draft-guard";
import { useExampleTexts } from "./use-example-texts";
import { useTemplateLabel } from "./use-template-label";

/** Everything chosen, each with Edit, then Activate: the baseline is saved in one go (ADR 0061) and the app opens. */
export function ReviewStep({ organization }: { organization: string }) {
  const t = useTranslations("welcome");
  const router = useRouter();
  const { org, draft } = useDraftGuard();
  const { run, pending } = useToastAction();
  const types = chosenTypes({ draft, groupName: ({ category }) => t(`groups.${category}`) });
  const statuses = getSetupPreset({ key: draft.kind ?? "empty" }).statuses;
  const label = useTemplateLabel();
  const pipeline = localizeDraft({
    draft: draftFromTypes({ statuses, types, existingTypes: [] }),
    statusName: ({ name }) => label({ group: "statuses", name }),
    stateName: ({ name }) => label({ group: "states", name }),
  });
  const exampleTexts = useExampleTexts();
  const examples = exampleOrdersInput({ draft, texts: exampleTexts });
  const activate = () =>
    run({
      action: () => activateSetupAction({ draft: pipeline, examples }),
      messages: {
        pending: t("setup.review.activating", { organization }),
        success: t("activated", { organization }),
      },
      onSuccess: () => router.push("/pipeline", { org }),
    });
  const back = draft.kind === "empty" ? "setup/kind" : "setup/extras";
  const spaces = draft.types
    .filter((type) => categoryOf({ type }) === "spaces" && type.checked)
    .map((type) => type.name);
  const food = draft.types
    .filter((type) => categoryOf({ type }) === "food" && type.checked)
    .map((type) => type.name);
  const extras = draft.types
    .filter((type) => categoryOf({ type }) === "extras" && type.checked)
    .map((type) => type.name);
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        activate();
      }}
    >
      <ReviewLists org={org} spaces={spaces} food={food} extras={extras} />
      <WelcomeStepActions
        back={{ href: welcomePath({ step: back }), org }}
        pending={pending}
        label={t("setup.review.activate")}
      />
    </form>
  );
}
