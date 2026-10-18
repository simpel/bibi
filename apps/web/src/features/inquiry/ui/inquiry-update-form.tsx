"use client";

import type { InquiryDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { inquiryRoute } from "@/lib/routes";
import { InquiryForm } from "./inquiry-form";
import type { InquiryFormData } from "./inquiry-form-data";

export type InquiryUpdateFormProps = { inquiry: InquiryDto; data: InquiryFormData };

/** The inquiry form on its update page; saving (or cancelling) goes back to the inquiry. */
export function InquiryUpdateForm({ inquiry, data }: InquiryUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <InquiryForm
        data={data}
        inquiry={inquiry}
        onDone={() => router.push(inquiryRoute({ id: inquiry.id }))}
      />
    </div>
  );
}
