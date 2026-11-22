"use client";

import { Button, Input } from "@bibi/ui";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, type KeyboardEvent, useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";

export type EditableTitleProps = {
  /** What the heading shows. */
  title: string;
  /** What the input starts with; differs from `title` when the title is a fallback label. */
  value: string;
  /** Dimmed sans text after the title, e.g. a reference number. */
  suffix?: string;
  maxLength: number;
  /** Accessible name of the input. */
  label: string;
  /** Tooltip and accessible name of the pencil. */
  editLabel: string;
  /** The toast after a successful save. */
  successMessage: string;
  /** Without write access the heading is plain text. */
  canEdit: boolean;
  /** Heading classes of the page, e.g. `text-3xl`. */
  className?: string;
  save: (input: { value: string }) => Promise<ActionResult<unknown>>;
};

/**
 * A page's `h1` with a pencil on hover (like a pull request title on GitHub): clicking it swaps
 * the title for an input with Save and Cancel; Enter saves, Escape cancels.
 */
export function EditableTitle(props: EditableTitleProps) {
  const { title, value, suffix, maxLength, label, editLabel, successMessage, canEdit } = props;
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const [draft, setDraft] = useState<string | null>(null);
  const heading = props.className ?? "text-3xl";

  const submit = () => {
    const next = (draft ?? "").trim();
    if (!next || pending) return;
    if (next === value) return setDraft(null);
    run({
      action: () => props.save({ value: next }),
      messages: { pending: common("saving"), success: successMessage },
      onSuccess: () => {
        setDraft(null);
        router.refresh();
      },
    });
  };
  if (draft !== null) {
    return (
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          submit();
        }}
        className="flex items-center gap-2"
      >
        <Input
          autoFocus
          value={draft}
          maxLength={maxLength}
          aria-label={label}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event: KeyboardEvent) => event.key === "Escape" && setDraft(null)}
          className="h-11 min-w-0 flex-1 text-xl"
        />
        <Button
          type="submit"
          size="icon"
          aria-label={common("save")}
          title={common("save")}
          disabled={pending || draft.trim() === ""}
          pending={pending}
        >
          <CheckIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={common("cancel")}
          title={common("cancel")}
          disabled={pending}
          onClick={() => setDraft(null)}
        >
          <XIcon />
        </Button>
      </form>
    );
  }
  return (
    <h1 className={`group/title flex items-baseline gap-2 ${heading}`}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: the pencil is the keyboard path */}
      <span className="min-w-0" onDoubleClick={canEdit ? () => setDraft(value) : undefined}>
        {title}
        {suffix ? (
          <span className="ml-3 font-sans text-xl font-normal text-muted-foreground tabular-nums">
            {suffix}
          </span>
        ) : null}
      </span>
      {canEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={editLabel}
          title={editLabel}
          onClick={() => setDraft(value)}
          className="size-8 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover/title:opacity-100"
        >
          <PencilIcon className="size-4" />
        </Button>
      ) : null}
    </h1>
  );
}
