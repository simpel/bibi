import { z } from "zod";

/** Auth form schemas live here (not in core): they validate Better Auth client calls. */
export const SignInSchema = z.object({ email: z.email(), password: z.string().min(1) });
export const SignUpSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  password: z.string().min(10).max(128),
});
export const EmailSchema = z.object({ email: z.email() });
export const OtpSchema = z.object({ code: z.string().trim().min(6).max(6) });
export const OrganizationNameSchema = z.object({ name: z.string().trim().min(2).max(100) });
export const ProfileNameSchema = z.object({ name: z.string().trim().min(1).max(100) });
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(128),
});

export type SignInValues = z.infer<typeof SignInSchema>;
export type SignUpValues = z.infer<typeof SignUpSchema>;
export type EmailValues = z.infer<typeof EmailSchema>;
export type OtpValues = z.infer<typeof OtpSchema>;
export type OrganizationNameValues = z.infer<typeof OrganizationNameSchema>;
export type ProfileNameValues = z.infer<typeof ProfileNameSchema>;
export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;
