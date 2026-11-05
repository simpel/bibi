"use client";

import type { SetupCategory } from "@bibi/core/setup-presets";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import type { TypeChoice } from "../../lib/setup-draft";
import { type WelcomeStep, welcomePath } from "../../lib/welcome-step";
import { WelcomeStepActions } from "../welcome-step-actions";
import { SkipSetupButton } from "./skip-setup-button";
import { TypeChoiceList } from "./type-choice-list";
import { useDraftGuard } from "./use-draft-guard";

export type TypeChoiceStepProps = { category: SetupCategory; back: WelcomeStep; next: WelcomeStep };

/** The spaces, food or extras types of the draft as checkboxes, prefilled from the kind. */
export function TypeChoiceStep({ category, back, next }: TypeChoiceStepProps) {
  const t = useTranslations("welcome.setup");
  const router = useRouter();
  const { org, draft, setDraft } = useDraftGuard();

  const add = ({ name }: { name: string }) =>
    setDraft({
      draft: {
        ...draft,
        types: [
          ...draft.types,
          {
            key: null,
            name,
            category,
            bookable: category === "spaces",
            checked: true,
          },
        ],
      },
    });

  const remove = ({ index }: { index: number }) =>
    setDraft({
      draft: {
        ...draft,
        types: draft.types.filter((_, at) => at !== index),
      },
    });

  const rows = draft.types
    .map((type, index): [TypeChoice, number] => [type, index])
    .filter(([type]) => (type.category ?? (type.bookable ? "spaces" : "food")) === category);

  const continueDisabled = category === "spaces" ? rows.length === 0 : false;

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(welcomePath({ step: next }), { org });
      }}
    >
      <TypeChoiceList
        rows={rows}
        onRemove={remove}
        onAdd={add}
        addPlaceholder={t(`${category}.placeholder`)}
      />
      <p className="text-sm text-muted-foreground">{t(`${category}.later`)}</p>
      <WelcomeStepActions
        back={{ href: welcomePath({ step: back }), org }}
        disabled={continueDisabled}
        aside={<SkipSetupButton org={org} />}
      />
    </form>
  );
}
