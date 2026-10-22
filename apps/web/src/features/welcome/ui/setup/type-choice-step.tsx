"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import type { TypeChoice } from "../../lib/setup-draft";
import { type WelcomeStep, welcomePath } from "../../lib/welcome-step";
import { WelcomeStepActions } from "../welcome-step-actions";
import { AddTypeInput } from "./add-type-input";
import { SkipSetupButton } from "./skip-setup-button";
import { TypeChoiceList } from "./type-choice-list";
import { useDraftGuard } from "./use-draft-guard";

export type TypeChoiceStepProps = { bookable: boolean; back: WelcomeStep; next: WelcomeStep };

/** The bookable or sellable types of the draft as checkboxes, prefilled from the kind. */
export function TypeChoiceStep({ bookable, back, next }: TypeChoiceStepProps) {
  const t = useTranslations("welcome.setup");
  const router = useRouter();
  const { org, draft, setDraft } = useDraftGuard();
  const toggle = ({ index, checked }: { index: number; checked: boolean }) =>
    setDraft({
      draft: {
        ...draft,
        types: draft.types.map((type, at) => (at === index ? { ...type, checked } : type)),
      },
    });
  const add = ({ name }: { name: string }) =>
    setDraft({
      draft: { ...draft, types: [...draft.types, { key: null, name, bookable, checked: true }] },
    });
  const rows = draft.types
    .map((type, index): [TypeChoice, number] => [type, index])
    .filter(([type]) => type.bookable === bookable);
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(welcomePath({ step: next }), { org });
      }}
    >
      <TypeChoiceList rows={rows} onToggle={toggle} />
      <AddTypeInput onAdd={add} />
      <p className="text-sm text-muted-foreground">
        {t(bookable ? "bookable.later" : "sellable.later")}
      </p>
      <WelcomeStepActions
        back={{ href: welcomePath({ step: back }), org }}
        aside={<SkipSetupButton org={org} />}
      />
    </form>
  );
}
