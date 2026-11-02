import { describe, expect, it } from "vitest";
import { execute, getItem, updateItem } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addLine, addOnSetup } from "./line-add-on-helpers";
import { bundleSetup, expand } from "./line-bundle-helpers";
import { choose, optionsSetup, picks } from "./line-options-helpers";

describe("line roles (ADR 0088)", () => {
  it("marks parts PART and chosen options OPTION; top-level lines have none", async () => {
    const setup = await bundleSetup();
    const { context, ticket, lineType, bundle } = setup;
    const base = { context, ticketId: ticket.id, entityTypeId: lineType.id, itemId: bundle.id };
    const { items } = unwrap({ result: await expand(base) });
    expect(items.map((line) => line.role)).toEqual([null, "PART", "PART", "PART"]);
    const options = await optionsSetup();
    const chosen = unwrap({
      result: await choose({
        ...{ context: options.context, lineId: options.lineId },
        options: picks({ ids: [options.technician.id] }),
      }),
    });
    expect(chosen.items.map((line) => line.role)).toEqual(["OPTION"]);
  });

  it("keeps role and parent consistent in the database", async () => {
    const { context, ticket, parent } = await addOnSetup();
    const addOn = unwrap({
      result: await addLine({ context, ticketId: ticket.id, parentLineId: parent.id }),
    });
    const orphan = context.db.line.update({ where: { id: addOn.id }, data: { role: null } });
    await expect(orphan).rejects.toThrow();
    const priced = context.db.line.update({
      where: { id: addOn.id },
      data: { priceEffect: "EXTRA" },
    });
    await expect(priced).rejects.toThrow();
    const roleless = context.db.line.update({ where: { id: parent.id }, data: { role: "PART" } });
    await expect(roleless).rejects.toThrow();
  });
});

describe("extra picks of a customisation group (ADR 0088)", () => {
  it("refuses more than the max and points to add-ons while the group allows extras", async () => {
    const { context, lineId, technician, selfInstall, room } = await optionsSetup();
    const both = picks({ ids: [technician.id, selfInstall.id] });
    const refused = await choose({ context, lineId, options: both });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    expect(refused.ok ? "" : refused.error.message).toBe(
      "Installation: choose 1 of its options; add more as add-ons",
    );
    const item = unwrap({
      result: await execute({ operation: getItem, input: { id: room.id }, context }),
    });
    expect(item.customisationGroups.map((group) => group.allowExtras)).toEqual([true, true]);
    const customisationGroups = item.customisationGroups.map(({ id: _id, ...group }) => ({
      ...group,
      allowExtras: group.name !== "Installation",
    }));
    const input = { id: room.id, customisationGroups };
    const updated = unwrap({ result: await execute({ operation: updateItem, input, context }) });
    expect(updated.customisationGroups.map((group) => group.allowExtras)).toEqual([false, true]);
    const hard = await choose({ context, lineId, options: both });
    expect(hard.ok ? "" : hard.error.message).toBe("Installation: choose 1 of its options");
  });
});
