import { z } from "zod";

/** pino levels in increasing severity; the list filter takes a minimum level. */
export const LOG_LEVELS = ["trace", "debug", "info", "warn", "error", "fatal"] as const;

export const LogLevelSchema = z.enum(LOG_LEVELS);

export type LogLevelName = z.infer<typeof LogLevelSchema>;

export const SystemLogSchema = z.object({
  id: z.string(),
  time: z.date(),
  level: z.string(),
  event: z.string(),
  msg: z.string().nullable(),
  service: z.string(),
  surface: z.string().nullable(),
  requestId: z.string().nullable(),
  organizationId: z.string().nullable(),
  userId: z.string().nullable(),
  operation: z.string().nullable(),
  status: z.number().int().nullable(),
  durationMs: z.number().nullable(),
  errorCode: z.string().nullable(),
  data: z.record(z.string(), z.unknown()),
});

export type SystemLogEntry = z.infer<typeof SystemLogSchema>;

const optionalText = z.string().trim().min(1).max(200).optional();

export const SystemLogListInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  /** Minimum level: `warn` returns warn, error and fatal. */
  level: LogLevelSchema.optional(),
  /** Case-insensitive match on event, message or operation. */
  q: optionalText,
  requestId: optionalText,
  organizationId: optionalText,
  userId: optionalText,
  surface: optionalText,
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type SystemLogListInput = z.input<typeof SystemLogListInputSchema>;

export type SystemLogListQuery = z.infer<typeof SystemLogListInputSchema>;

export const SystemLogListOutputSchema = z.object({
  items: z.array(SystemLogSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  pageCount: z.number().int(),
});

export type SystemLogPage = z.infer<typeof SystemLogListOutputSchema>;

export const SystemLogIdInputSchema = z.object({ id: z.string().min(1) });
