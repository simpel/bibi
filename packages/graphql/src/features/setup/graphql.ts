import {
  archiveSetup,
  createSetup,
  getSetup,
  listSetups,
  type SetupDto,
  SetupSchema,
  updateSetup,
} from "@okazi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const SetupRef = objectFromSchema<SetupDto>({
  name: "Setup",
  schema: SetupSchema,
  omit: ["organizationId"],
  description: "Setup – a way to arrange a space (e.g. Bio, U-bord), with changeover time.",
});
const SetupPageRef = pageType({ name: "SetupPage", item: SetupRef });

fieldFromOperation({ operation: listSetups, type: SetupPageRef, name: "setups" });
fieldFromOperation({ operation: getSetup, type: SetupRef, name: "setup" });
mutationFromOperation({ operation: createSetup, type: SetupRef });
mutationFromOperation({ operation: updateSetup, type: SetupRef });
mutationFromOperation({ operation: archiveSetup, type: SetupRef });
