"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { createTaskTypeAction } from "../actions";

export type TaskTypeCreateProps = {
  /** Called with the new type's id so the form can select it. */
  onCreated: (input: { id: string }) => void;
};

/**
 * Create type, right in the task form: a task type needs only a name, so a small dialog does it
 * and the new type is selected (spec: tasks). Fields and the rest stay under Types.
 */
export function TaskTypeCreate({ onCreated }: TaskTypeCreateProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { run, pending } = useToastAction();
  const create = () =>
    run({
      action: () => createTaskTypeAction({ name: name.trim() }),
      messages: { pending: common("saving"), success: t("typeCreated") },
      onSuccess: ({ value }) => {
        onCreated({ id: value.id });
        setOpen(false);
        setName("");
        router.refresh();
      },
    });
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="justify-self-start"
        onClick={() => setOpen(true)}
      >
        <PlusIcon aria-hidden />
        {t("createType")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("createType")}</DialogTitle>
            <DialogDescription>{t("createTypeDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="task-type-name">{t("typeName")}</Label>
            <Input
              id="task-type-name"
              value={name}
              autoFocus
              placeholder={t("typeNamePlaceholder")}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && name.trim() && !pending) {
                  event.preventDefault();
                  create();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {common("cancel")}
            </Button>
            <Button type="button" disabled={!name.trim() || pending} onClick={create}>
              {t("createType")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
