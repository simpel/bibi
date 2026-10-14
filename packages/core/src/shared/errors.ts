import { AppError, type AppErrorIssue } from "../errors/app-error";
import { err } from "../errors/result";

export type NotFoundInput = { entity: string };

/** `NOT_FOUND` for an entity that is missing, archived or in another organization. */
export const notFound = ({ entity }: NotFoundInput) =>
  err({ error: new AppError({ code: "NOT_FOUND", message: `${entity} not found` }) });

export type ConflictInput = { message: string };

/** `CONFLICT`: the change is valid in itself but clashes with existing data. */
export const conflict = ({ message }: ConflictInput) =>
  err({ error: new AppError({ code: "CONFLICT", message }) });

export type InvalidInput = { message: string; issues?: readonly AppErrorIssue[] };

/** `VALIDATION` with field issues (`path` = input field), shown next to form fields. */
export const invalid = ({ message, issues = [] }: InvalidInput) =>
  err({ error: new AppError({ code: "VALIDATION", message, issues }) });
