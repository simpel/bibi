import { z } from "zod";

/** Auth form schemas live here (not in core): they validate Better Auth client calls. */
export const EmailSchema = z.object({ email: z.email() });
export const SignUpSchema = z.object({ name: z.string().trim().min(1).max(100), email: z.email() });
export const OrganizationNameSchema = z.object({ name: z.string().trim().min(2).max(100) });
export const ProfileNameSchema = z.object({ name: z.string().trim().min(1).max(100) });

export type EmailValues = z.infer<typeof EmailSchema>;
export type SignUpValues = z.infer<typeof SignUpSchema>;
export type OrganizationNameValues = z.infer<typeof OrganizationNameSchema>;
export type ProfileNameValues = z.infer<typeof ProfileNameSchema>;
