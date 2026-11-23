import { afterEach, describe, expect, it } from "vitest";
import {
  createItem,
  createMemoryFileStore,
  execute,
  getFile,
  setFileStore,
  updateItem,
  updateOrderTemplate,
  uploadFile,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";
import { createItemType } from "./item-customisation-group-helpers";
import { makeTemplate, templateSetup } from "./order-template-helpers";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const image = { contentType: "image/png", base64: PNG.toString("base64") } as const;

type Ctx = { context: ReturnType<typeof testContext> };

const upload = async ({ context }: Ctx) =>
  unwrap({ result: await execute({ operation: uploadFile, input: image, context }) }).key;

afterEach(() => setFileStore({ store: undefined }));

describe("item icon and image (ADR 0063)", () => {
  it("keeps an icon and an uploaded image, and colleagues can read the image", async () => {
    setFileStore({ store: createMemoryFileStore() });
    const context = testContext();
    const type = await createItemType({ context, name: "Activity" });
    const imageKey = await upload({ context });
    const input = { entityTypeId: type.id, name: "Wine tasting", icon: "wine", imageKey };
    const item = unwrap({ result: await execute({ operation: createItem, input, context }) });
    expect(item).toMatchObject({ icon: "wine", imageKey });
    const reader = peer({ of: context, access: "read" });
    const read = await execute({ operation: getFile, input: { key: imageKey }, context: reader });
    expect(errorCode({ result: read })).toBeNull();
    const cleared = await execute({
      operation: updateItem,
      input: { id: item.id, imageKey: null, icon: "grape" },
      context,
    });
    expect(unwrap({ result: cleared })).toMatchObject({ icon: "grape", imageKey: null });
  });

  it("refuses another user's upload and an icon name that is not kebab-case", async () => {
    setFileStore({ store: createMemoryFileStore() });
    const context = testContext();
    const type = await createItemType({ context, name: "Activity" });
    const foreign = await upload({ context: peer({ of: context }) });
    const base = { entityTypeId: type.id, name: "Wine tasting" };
    for (const bad of [{ imageKey: foreign }, { icon: "Wine Glass" }]) {
      const result = await execute({ operation: createItem, input: { ...base, ...bad }, context });
      expect(errorCode({ result })).toBe("VALIDATION");
    }
  });

  it("keeps the image when another user edits the item without touching it", async () => {
    setFileStore({ store: createMemoryFileStore() });
    const context = testContext();
    const type = await createItemType({ context, name: "Activity" });
    const imageKey = await upload({ context });
    const input = { entityTypeId: type.id, name: "Wine tasting", imageKey };
    const item = unwrap({ result: await execute({ operation: createItem, input, context }) });
    const result = await execute({
      operation: updateItem,
      input: { id: item.id, name: "Wine tasting deluxe", imageKey },
      context: peer({ of: context }),
    });
    expect(unwrap({ result }).imageKey).toBe(imageKey);
  });
});

describe("package image (ADR 0063)", () => {
  it("sets a package's image from the caller's upload, readable by colleagues", async () => {
    setFileStore({ store: createMemoryFileStore() });
    const setup = await templateSetup();
    const { context } = setup;
    const template = unwrap({ result: await makeTemplate({ context, setup }) });
    expect(template.imageKey).toBeNull();
    const imageKey = await upload({ context });
    const updated = await execute({
      operation: updateOrderTemplate,
      input: { id: template.id, imageKey },
      context,
    });
    expect(unwrap({ result: updated }).imageKey).toBe(imageKey);
    const read = await execute({
      operation: getFile,
      input: { key: imageKey },
      context: peer({ of: context }),
    });
    expect(errorCode({ result: read })).toBeNull();
    const other = testContext();
    const outside = await execute({ operation: getFile, input: { key: imageKey }, context: other });
    expect(errorCode({ result: outside })).toBe("NOT_FOUND");
  });
});
