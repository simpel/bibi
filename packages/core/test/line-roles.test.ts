import { describe, expect, it } from "vitest";
import { errorCode, unwrap } from "./helpers";
import { addLine, addOnSetup } from "./line-add-on-helpers";
import { bundleSetup, expand } from "./line-bundle-helpers";
import { choose, optionsSetup, picks } from "./line-options-helpers";

describe("line roles (ADR 0088)", () => {
  it("marks parts PART and chosen options OPTION; top-level lines have none", async () => {
    const setup = await bundleSetup();
    const { context, order, lineType, bundle } = setup;
    const base = { context, orderId: order.id, entityTypeId: lineType.id, itemId: bundle.id };
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
    const { context, order, parent } = await addOnSetup();
    const addOn = unwrap({
      result: await addLine({ context, orderId: order.id, parentLineId: parent.id }),
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

describe("picks beyond a customisation group's max (ADR 0088)", () => {
  it("refuses more than the max and points to add-ons", async () => {
    const { context, lineId, technician, selfInstall } = await optionsSetup();
    const both = picks({ ids: [technician.id, selfInstall.id] });
    const refused = await choose({ context, lineId, options: both });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    expect(refused.ok ? "" : refused.error.message).toBe(
      "Installation: choose 1 of its options; add more as add-ons",
    );
  });
});
