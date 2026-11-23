import { z } from "zod";

/**
 * A Lucide icon by its kebab-case name (lucide.dev/icons), e.g. `wine` or `presentation`. Core
 * checks only the shape; the web app's picker offers the names Lucide has.
 */
export const IconNameSchema = z
  .string()
  .trim()
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "A Lucide icon name, e.g. wine" })
  .describe("A Lucide icon name (lucide.dev/icons), e.g. wine, presentation or coffee");
