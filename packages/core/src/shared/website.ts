import { z } from "zod";

/**
 * Validates a website URL (http or https, max 300 characters).
 */
export const WebsiteSchema = z
  .string()
  .trim()
  .max(300, { message: "Website URL is too long" })
  .url({ message: "Enter a valid website URL, e.g. https://example.se" })
  .describe("Website URL, e.g. https://example.se");
