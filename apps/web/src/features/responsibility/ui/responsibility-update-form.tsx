"use client";

import type { ResponsibilityDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { ResponsibilityForm } from "./responsibility-form";
import type { ResponsibilityOptions } from "./responsibility-options";

export type ResponsibilityUpdateFormProps = {
  responsibility: ResponsibilityDto;
  options: ResponsibilityOptions;
};

/** The form on its update page; saving (or cancelling) goes back to the list. */
export function ResponsibilityUpdateForm({
  responsibility,
  options,
}: ResponsibilityUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <ResponsibilityForm
        responsibility={responsibility}
        options={options}
        onDone={() => router.push(ROUTES.settingsResponsibilities)}
      />
    </div>
  );
}
