import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";
import "./fonts.css";
import "../src/styles/index.css";
import { CalendarLabelsProvider } from "../src/components/availability-calendar/calendar-labels";
import { STORY_LABELS } from "../src/stories/calendar/story-labels";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { matchers: { color: /(background|color)$/i } },
  },
  decorators: [
    // The calendar's words: the app passes its translations, the stories English.
    (Story) => (
      <CalendarLabelsProvider labels={STORY_LABELS}>
        <Story />
      </CalendarLabelsProvider>
    ),
    withThemeByClassName({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
