export type SpacingStep = {
  step: string;
  px: number;
  rem: string;
  usage: string;
};

export const SPACING_STEPS: SpacingStep[] = [
  { step: "1", px: 4, rem: "0.25rem", usage: "Tight icon gaps, badge vertical padding" },
  { step: "2", px: 8, rem: "0.5rem", usage: "Button inline padding, chip gaps, input icons" },
  { step: "3", px: 12, rem: "0.75rem", usage: "Compact list item spacing, dropdown padding" },
  { step: "4", px: 16, rem: "1.0rem", usage: "Standard card padding, form field vertical gaps" },
  { step: "5", px: 20, rem: "1.25rem", usage: "Drawer gutters, card header separation" },
  { step: "6", px: 24, rem: "1.5rem", usage: "Generous card content padding, dialog margins" },
  { step: "8", px: 32, rem: "2.0rem", usage: "Section separation, sheet body padding" },
  { step: "10", px: 40, rem: "2.5rem", usage: "Grid column gaps, modal dialog padding" },
  { step: "12", px: 48, rem: "3.0rem", usage: "Page header margin, container padding" },
  { step: "16", px: 64, rem: "4.0rem", usage: "Large viewport section separation" },
];

export type RadiusStep = {
  name: string;
  variable: string;
  className: string;
  calc: string;
  usage: string;
};

export const RADIUS_STEPS: RadiusStep[] = [
  {
    name: "Small",
    variable: "radius-sm",
    className: "rounded-sm",
    calc: "4px (0.25rem)",
    usage: "Status badges, tags, checkboxes",
  },
  {
    name: "Medium",
    variable: "radius-md",
    className: "rounded-md",
    calc: "6px (0.375rem)",
    usage: "Buttons, text inputs, dropdown menu items",
  },
  {
    name: "Large (Base)",
    variable: "radius-lg",
    className: "rounded-lg",
    calc: "8px (0.5rem)",
    usage: "Cards, panels, sheets, dialog containers",
  },
  {
    name: "Extra Large",
    variable: "radius-xl",
    className: "rounded-xl",
    calc: "12px (0.75rem)",
    usage: "Outer modal windows, floating assistant panels",
  },
  {
    name: "Full",
    variable: "rounded-full",
    className: "rounded-full",
    calc: "9999px",
    usage: "User avatars, count badges, pill tabs",
  },
];

export type ShadowStep = {
  name: string;
  variable: string;
  className: string;
  elevation: string;
  usage: string;
};

export const SHADOW_STEPS: ShadowStep[] = [
  {
    name: "Extra Small (xs)",
    variable: "shadow-xs",
    className: "shadow-xs",
    elevation: "1px resting",
    usage: "Table rows, subtle card borders, resting list cards",
  },
  {
    name: "Small (sm)",
    variable: "shadow-sm",
    className: "shadow-sm",
    elevation: "3px lift",
    usage: "Interactive hover cards, button clicks, small tooltips",
  },
  {
    name: "Medium (md)",
    variable: "shadow-md",
    className: "shadow-md",
    elevation: "10px floating",
    usage: "Dropdown menus, select popovers, floating command bars",
  },
  {
    name: "Large (lg)",
    variable: "shadow-lg",
    className: "shadow-lg",
    elevation: "28px modal",
    usage: "Modal dialogs, slide-in sheets, full-screen takeover drawers",
  },
];
