"use client";

import { useState } from "react";
import { OtpCodeForm } from "./otp-code-form";
import { OtpEmailForm } from "./otp-email-form";

export type OtpFormProps = { next: string };

/** Two steps: request a code for an email, then enter it. */
export function OtpForm({ next }: OtpFormProps) {
  const [email, setEmail] = useState<string | null>(null);
  if (email === null) return <OtpEmailForm onSent={setEmail} />;
  return <OtpCodeForm email={email} next={next} />;
}
