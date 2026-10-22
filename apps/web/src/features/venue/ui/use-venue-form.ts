"use client";

import type { VenueCreateInput, VenueDto } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodMessageMap } from "@/lib/zod-error-map";
import { type VenueFormValues, venueFormDefaults, venueFormSchema } from "./venue-form-schema";

export type UseVenueFormInput = { venue?: VenueDto | undefined };

/** react-hook-form wired to core's venue schema with localized validation messages. */
export function useVenueForm({ venue }: UseVenueFormInput) {
  const t = useTranslations("errors");
  const resolver = zodResolver(venueFormSchema, {
    error: zodMessageMap({ translate: (key) => t(key) }),
  });
  return useForm<VenueFormValues, unknown, VenueCreateInput>({
    resolver,
    defaultValues: venueFormDefaults({ venue }),
  });
}
