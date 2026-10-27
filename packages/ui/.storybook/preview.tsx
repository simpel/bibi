import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";
import "./fonts.css";
import "../src/styles/index.css";
import { CalendarLabelsProvider } from "../src/components/availability-calendar/calendar-labels";
import { ContactLabelsProvider } from "../src/components/person-contact/contact-labels";
import { STORY_LABELS } from "../src/stories/calendar/story-labels";

const CONTACT_LABELS = {
  phone: "Phone",
  email: "Email",
  copy: ({ label }: { label: string }) => `Copy ${label.toLowerCase()}`,
  copied: ({ label }: { label: string }) => `${label} copied`,
  copyFailed: "Could not copy",
};

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { matchers: { color: /(background|color)$/i } },
  },
  decorators: [
    // The calendar's and contact card's words: the app passes its translations, the stories English.
    (Story) => (
      <CalendarLabelsProvider labels={STORY_LABELS}>
        <ContactLabelsProvider labels={CONTACT_LABELS}>
          <Story />
        </ContactLabelsProvider>
      </CalendarLabelsProvider>
    ),
    withThemeByClassName({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
