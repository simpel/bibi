import {
  getProfile,
  getWorkingHours,
  type ProfileDto,
  ProfileSchema,
  setWorkingHours,
  updateProfile,
  type WorkingDay,
  WorkingDaySchema,
  type WorkingHoursDto,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

export const ProfileRef = objectFromSchema<ProfileDto>({
  name: "Profile",
  schema: ProfileSchema,
  description: "The caller's own profile, shared across organizations (ADR 0061).",
});

const WorkingDayRef = objectFromSchema<WorkingDay>({
  name: "WorkingDay",
  schema: WorkingDaySchema,
  description: "One working weekday (0 = Monday); times are minutes after midnight.",
});

export const WorkingHoursRef = builder.objectRef<WorkingHoursDto>("WorkingHours").implement({
  description: "The caller's own working days, sorted by weekday; a missing weekday is a day off.",
  fields: (t) => ({
    days: t.field({ type: [WorkingDayRef], resolve: (hours) => hours.days }),
  }),
});

fieldFromOperation({ operation: getProfile, type: ProfileRef, name: "profile" });
mutationFromOperation({ operation: updateProfile, type: ProfileRef });
fieldFromOperation({ operation: getWorkingHours, type: WorkingHoursRef, name: "workingHours" });
mutationFromOperation({ operation: setWorkingHours, type: WorkingHoursRef });
