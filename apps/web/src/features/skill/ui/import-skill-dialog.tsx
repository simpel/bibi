"use client";

import type { SkillDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorBanner } from "@/components/states/error-banner";
import { skillRoute } from "@/lib/routes";
import { useActionSubmit } from "@/lib/use-action-submit";
import { importSkillAction } from "../actions";
import type { SkillScopeChoice } from "../skill-types";
import { ImportSkillFields } from "./import-skill-fields";

type ImportButtonProps = { pending: boolean; markdown: string; onImport: () => void };

function ImportButton({ pending, markdown, onImport }: ImportButtonProps) {
  const t = useTranslations("skills");
  return (
    <Button disabled={pending || !markdown.trim()} onClick={onImport}>
      {t("import")}
    </Button>
  );
}

export type ImportSkillDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

/** Import a SKILL.md (paste or upload) as a draft skill; opens the new skill. */
export function ImportSkillDialog({ open, onOpenChange }: ImportSkillDialogProps) {
  const t = useTranslations("skills");
  const common = useTranslations("common");
  const router = useRouter();
  const [markdown, setMarkdown] = useState("");
  const [scope, setScope] = useState<SkillScopeChoice>("PERSONAL");
  const { pending, errorKey, run } = useActionSubmit<SkillDto>({
    onSuccess: (skill) => {
      toast.success(t("imported"));
      onOpenChange(false);
      router.push(skillRoute({ id: skill.id }));
    },
  });
  const submit = () => run({ action: () => importSkillAction({ markdown, scope }) });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("importTitle")}</DialogTitle>
          <DialogDescription>{t("importDescription")}</DialogDescription>
        </DialogHeader>
        <ErrorBanner errorKey={errorKey} />
        <ImportSkillFields
          markdown={markdown}
          scope={scope}
          onMarkdown={setMarkdown}
          onScope={setScope}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {common("cancel")}
          </Button>
          <ImportButton pending={pending} markdown={markdown} onImport={submit} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
