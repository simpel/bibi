import {
  listNotificationPreferences,
  type NotificationPreferenceDto,
  NotificationPreferenceSchema,
  setNotificationPreference,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const NotificationPreferenceRef = objectFromSchema<NotificationPreferenceDto>({
  name: "NotificationPreference",
  schema: NotificationPreferenceSchema,
  description: "Whether the caller gets one kind of notification (on unless turned off).",
});

const NotificationPreferenceListRef = builder
  .objectRef<{ items: NotificationPreferenceDto[] }>("NotificationPreferenceList")
  .implement({
    description: "One entry per kind of notification.",
    fields: (t) => ({
      items: t.field({ type: [NotificationPreferenceRef], resolve: (list) => list.items }),
    }),
  });

fieldFromOperation({
  operation: listNotificationPreferences,
  type: NotificationPreferenceListRef,
  name: "notificationPreferences",
});
mutationFromOperation({ operation: setNotificationPreference, type: NotificationPreferenceRef });
