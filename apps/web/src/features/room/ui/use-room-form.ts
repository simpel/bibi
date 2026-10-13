"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { RoomCreateInput, RoomDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodMessageMap } from "@/lib/zod-error-map";
import { type RoomFormValues, roomFormDefaults, roomFormSchema } from "./room-form-schema";

export type UseRoomFormInput = { venueId: string; room?: RoomDto | undefined };

/** react-hook-form wired to core's room schema with localized validation messages. */
export function useRoomForm({ venueId, room }: UseRoomFormInput) {
  const t = useTranslations("errors");
  const resolver = zodResolver(roomFormSchema, {
    error: zodMessageMap({ translate: (key) => t(key) }),
  });
  return useForm<RoomFormValues, unknown, RoomCreateInput>({
    resolver,
    defaultValues: roomFormDefaults({ venueId, room }),
  });
}
