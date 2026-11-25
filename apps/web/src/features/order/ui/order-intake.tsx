import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { hasDraftModel } from "@/server/draft-model";
import { handleLoadError } from "@/server/load-error";
import { IntakePage } from "../intake/intake-page";
import { type IntakeSlot, packagesWithItem, slotDraftKey } from "../intake/intake-slot";
import type { IntakeStep } from "../intake/intake-state";
import { loadIntakeData } from "../load-intake-data";
import { loadIntakeMessage } from "../load-intake-message";
import { loadIntakeTask } from "../load-intake-task";

export type OrderIntakeProps = {
  locale: Locale;
  /** `?fromMessage=<id>`: the inbox message the order is made from (ADR 0085). */
  fromMessage?: string | undefined;
  /** `?fromTask=<id>`: the task the order is created from and linked to (ADR 0117). */
  fromTask?: string | undefined;
  /** `?slot=…&date=…&from=…&to=…`: the calendar slot the order starts from, or null. */
  slot?: IntakeSlot | null;
  /** `?template=<id>`: the booking template step 3 preselects, or null. */
  templateId?: string | null;
  /** The step in the path (`/new/order/<step>`); `who` for `/new/order` and `/message`. */
  step: IntakeStep;
};

/**
 * `/new/order`: the one-page order intake (ADR 0081), optionally from an inbox message, a task
 * (ADR 0117) or a calendar slot.
 */
export async function OrderIntake({
  locale,
  fromMessage,
  fromTask,
  slot = null,
  templateId = null,
  step,
}: OrderIntakeProps) {
  const t = await getTranslations("orderIntake");
  const [data, message, task, draftEnabled] = await Promise.all([
    loadIntakeData(),
    loadIntakeMessage({ id: fromMessage }),
    loadIntakeTask({ id: fromTask }),
    // The paste dialog opens only while drafting has a model (ADR 0084).
    hasDraftModel(),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  // A message's intake keeps its own draft, so it never picks up another draft's message.
  // A calendar slot's intake keeps its own draft too, one per slot; a template's, one per template.
  const base = data.value.draftKey;
  const draftKey = message
    ? `${base}.message.${message.id}`
    : task
      ? `${base}.task.${task.id}`
      : slot
        ? slotDraftKey({ key: base, slot })
        : templateId
          ? `${base}.template.${templateId}`
          : base;
  // Started from a slot, step 3 lists only the packages that book its resource.
  const packages = slot
    ? packagesWithItem({ packages: data.value.packages, itemId: slot.itemId })
    : data.value.packages;
  return (
    <FormPageShell title={t("title")} description={t("description")}>
      <IntakePage
        data={{ ...data.value, draftKey, packages, slot, templateId }}
        message={message}
        task={task}
        draftEnabled={draftEnabled}
        step={step}
      />
    </FormPageShell>
  );
}
