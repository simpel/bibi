"use client";

import { Button } from "@bibi/ui";
import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { InlineEditContext } from "@/components/inline-edit/inline-edit";
import { Link, useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updateTaskAction } from "../actions";

export type TaskRelatedItem = { id: string; name: string; href: string };

export type TaskRelatedListProps = {
  taskId: string;
  items: readonly TaskRelatedItem[];
  canEdit: boolean;
  /** The item picker, shown in place of the Add button; it closes itself with `useInlineEdit`. */
  editor: ReactNode;
};

/** The page's side column: the rooms and items the task is about, as a list with Add. */
export function TaskRelatedList({ taskId, items, canEdit, editor }: TaskRelatedListProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { run, pending } = useToastAction();
  const remove = () =>
    run({
      action: () => updateTaskAction({ input: { id: taskId, itemId: null } }),
      messages: { pending: common("saving"), success: t("updated") },
      onSuccess: () => router.refresh(),
    });
  return (
    <section className="grid content-start gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{t("related")}</h2>
      {items.length > 0 ? (
        <ul className="grid gap-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <Link href={item.href} className="min-w-0 truncate hover:underline">
                {item.name}
              </Link>
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  aria-label={t("removeRelated", { name: item.name })}
                  disabled={pending}
                  onClick={remove}
                >
                  <XIcon />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("relatedEmpty")}</p>
      )}
      {canEdit && adding ? (
        <InlineEditContext.Provider value={{ close: () => setAdding(false) }}>
          {editor}
        </InlineEditContext.Provider>
      ) : null}
      {canEdit && !adding && items.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={() => setAdding(true)}
        >
          <PlusIcon aria-hidden />
          {t("addRelated")}
        </Button>
      ) : null}
    </section>
  );
}
