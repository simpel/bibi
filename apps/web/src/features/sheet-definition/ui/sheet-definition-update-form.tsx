"use client";

import type { SheetDefinitionDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { SheetDefinitionForm } from "./sheet-definition-form";
import type { SheetOptions } from "./sheet-options";

export type SheetDefinitionUpdateFormProps = { sheet: SheetDefinitionDto; options: SheetOptions };

/** The form on its update page; saving (or cancelling) goes back to the list. */
export function SheetDefinitionUpdateForm({ sheet, options }: SheetDefinitionUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <SheetDefinitionForm
        sheet={sheet}
        options={options}
        onDone={() => router.push(ROUTES.settingsSheets)}
      />
    </div>
  );
}
