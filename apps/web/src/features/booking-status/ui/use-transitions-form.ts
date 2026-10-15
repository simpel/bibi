import { zodResolver } from "@hookform/resolvers/zod";
import type { BookingStatusDto } from "@okazi/core/schemas";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type TransitionsFormOutput,
  type TransitionsFormValues,
  transitionsFormSchema,
} from "./transitions-form-schema";

export type UseTransitionsFormInput = { status: BookingStatusDto };

/** react-hook-form for the statuses a booking may move to from `status`. */
export function useTransitionsForm({ status }: UseTransitionsFormInput) {
  const schema = useMemo(() => transitionsFormSchema({ status }), [status]);
  return useForm<TransitionsFormValues, unknown, TransitionsFormOutput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: { toStatusIds: [...status.transitionsTo] },
  });
}
