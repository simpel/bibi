"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InquiryDialog } from "./inquiry-dialog";
import type { InquiryFormData } from "./inquiry-form-data";

export type CreateInquiryButtonProps = { data: InquiryFormData };

/** Opens the create-inquiry dialog; also opens on `?create=1`. */
export function CreateInquiryButton({ data }: CreateInquiryButtonProps) {
  const t = useTranslations("inquiry");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(useSearchParams().get("create") === "1");
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <InquiryDialog
        data={data}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) router.replace(pathname);
        }}
      />
    </>
  );
}
