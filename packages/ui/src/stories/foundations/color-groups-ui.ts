import type { ColorGroup } from "./color-types";

export const UI_COLOR_GROUPS: ColorGroup[] = [
  {
    title: "Interface & Neutral Structure",
    description: "Borders, text hierarchy, and keyboard focus indicators.",
    tokens: [
      {
        name: "Foreground",
        variable: "foreground",
        role: "Primary reading text",
        description: "Deep espresso slate providing > 14:1 contrast ratio against canvas.",
      },
      {
        name: "Muted",
        variable: "muted",
        fgVariable: "muted-foreground",
        role: "Subdued backgrounds & chips",
        description: "Gentle sand tone for inactive elements, tags, and table headers.",
      },
      {
        name: "Muted Foreground",
        variable: "muted-foreground",
        role: "Supporting text & timestamps",
        description: "Balanced slate for secondary labels, passing WCAG AA contrast.",
      },
      {
        name: "Border",
        variable: "border",
        role: "Card & table separators",
        description: "Crisp architectural line separating content blocks cleanly.",
      },
      {
        name: "Input",
        variable: "input",
        role: "Form field boundaries",
        description: "Defined boundary for text inputs, selects, and checkboxes.",
      },
      {
        name: "Ring",
        variable: "ring",
        role: "Keyboard focus outline",
        description: "Accessible spruce focus ring adhering to WCAG 2.2 focus visibility.",
      },
    ],
  },
  {
    title: "Data Visualization & Charts",
    description:
      "Harmonious palette for occupancy curves, revenue breakdowns, and booking pipelines.",
    tokens: [
      {
        name: "Chart 1 (Spruce)",
        variable: "chart-1",
        role: "Conferences & room hire",
        description: "Primary category anchor in data charts.",
      },
      {
        name: "Chart 2 (Terracotta)",
        variable: "chart-2",
        role: "Food & beverage catering",
        description: "Warm heritage contrast for meal revenues.",
      },
      {
        name: "Chart 3 (Aged Brass)",
        variable: "chart-3",
        role: "Add-ons & technology rentals",
        description: "Luminous gold for equipment and extras.",
      },
      {
        name: "Chart 4 (Baltic Blue)",
        variable: "chart-4",
        role: "External partner services",
        description: "Calm maritime blue for third-party deliveries.",
      },
      {
        name: "Chart 5 (Lingonberry)",
        variable: "chart-5",
        role: "Special events & private dining",
        description: "Distinct berry tone for seasonal and evening banquets.",
      },
    ],
  },
];
