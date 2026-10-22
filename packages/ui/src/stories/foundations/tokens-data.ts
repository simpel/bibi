export const CORE_COLORS = [
  { name: "background", fg: "foreground", label: "Canvas" },
  { name: "card", fg: "card-foreground", label: "Card Surface" },
  { name: "primary", fg: "primary-foreground", label: "Spruce Primary" },
  { name: "accent", fg: "accent-foreground", label: "Aged Brass" },
  { name: "secondary", fg: "secondary-foreground", label: "Limestone" },
  { name: "muted", fg: "muted-foreground", label: "Muted" },
  { name: "success", fg: "success-foreground", label: "Meadow Sage" },
  { name: "warning", fg: "warning-foreground", label: "Amber Honey" },
  { name: "destructive", fg: "destructive-foreground", label: "Madder Red" },
] as const;

export const RADIUS_TOKENS = [
  { name: "sm", label: "4px", className: "rounded-sm" },
  { name: "md", label: "6px", className: "rounded-md" },
  { name: "lg", label: "8px (Base)", className: "rounded-lg" },
  { name: "xl", label: "12px", className: "rounded-xl" },
] as const;

export const SHADOW_TOKENS = [
  { name: "xs", label: "1px Subtle", className: "shadow-xs" },
  { name: "sm", label: "3px Lift", className: "shadow-sm" },
  { name: "md", label: "10px Floating", className: "shadow-md" },
  { name: "lg", label: "28px Modal", className: "shadow-lg" },
] as const;
