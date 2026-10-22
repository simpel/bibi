import type { ReactNode } from "react";
import { Label } from "../../components/label/label";

export type SettingsFieldProps = {
  id?: string;
  label: string;
  hint?: string;
  children: ReactNode;
};

export function SettingsField({ id, label, hint, children }: SettingsFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
