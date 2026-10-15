"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BookingDialog } from "./booking-dialog";
import type { BookingFormData } from "./booking-form-data";

export type CreateBookingButtonProps = { data: BookingFormData };

/** Opens the create-booking dialog; also opens on `?create=1`. */
export function CreateBookingButton({ data }: CreateBookingButtonProps) {
  const t = useTranslations("booking");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(useSearchParams().get("create") === "1");
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <BookingDialog
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
