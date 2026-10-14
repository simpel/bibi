import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { ConfigurationTemplate } from "../../templates/configuration/configuration-template";
import { insertSetup } from "../setup/insert-setup";
import type { SetupDto } from "../setup/schema";
import { withEntityType } from "./with-entity-type";

export type ImportSetupsInput = { context: OperationContext; template: ConfigurationTemplate };

export type ImportedSetups = { created: SetupDto[]; skipped: string[] };

/** Creates the template's setups that do not exist yet; existing names are kept as they are. */
export async function importSetups({
  context,
  template,
}: ImportSetupsInput): Promise<Result<ImportedSetups>> {
  const setups: ImportedSetups = { created: [], skipped: [] };
  const audited = withEntityType({ context, entityType: "setup" });
  for (const setup of template.setups) {
    if (await context.db.setup.findFirst({ where: { name: setup.name } })) {
      setups.skipped.push(setup.name);
      continue;
    }
    const created = await insertSetup({ context: audited, ...setup });
    if (!created.ok) return created;
    setups.created.push(created.value);
  }
  return ok({ value: setups });
}
