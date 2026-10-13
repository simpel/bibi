import { AppError } from "../../errors/app-error";
import { err } from "../../errors/result";

/** Shared "not found" for skill operations (also used for skills the caller may not see). */
export const skillNotFound = () =>
  err({ error: new AppError({ code: "NOT_FOUND", message: "Skill not found" }) });
