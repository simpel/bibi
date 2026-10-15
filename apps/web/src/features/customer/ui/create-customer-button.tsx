"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { CustomerDialog } from "./customer-dialog";

export type CreateCustomerButtonProps = { data: TypedFormData };

/** Opens the create-customer dialog; also opens on `?create=1`. */
export function CreateCustomerButton({ data }: CreateCustomerButtonProps) {
  const t = useTranslations("customer");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(useSearchParams().get("create") === "1");
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <CustomerDialog
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
