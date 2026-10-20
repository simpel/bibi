import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Questionnaire,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "./questionnaire";
import { QuestionnaireActions, QuestionnaireSubmit } from "./questionnaire-actions";
import {
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireInput,
} from "./questionnaire-choices";

const meta = { title: "Components/Questionnaire" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  {
    name: "place",
    required: true,
    choices: [{ value: "conference-estate" }, { value: "restaurant" }, { value: "other" }],
  },
] as const;

/** One question with clickable answers and a free-text answer, as the assistant asks it. */
export const SingleChoice: Story = {
  render: () => (
    <Questionnaire
      className="max-w-lg"
      defaultItem="place"
      items={items}
      shortcuts="numbers"
      onSubmit={(event) => event.preventDefault()}
    >
      <QuestionnaireItem name="place" required>
        <QuestionnaireTitle>What kind of place do you run?</QuestionnaireTitle>
        <QuestionnaireDescription>
          Pick the closest one, or write your own.
        </QuestionnaireDescription>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="conference-estate">
            <span className="font-medium">A conference venue</span>
            <QuestionnaireChoiceDescription>
              Meeting rooms, food and activities
            </QuestionnaireChoiceDescription>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="restaurant">
            A restaurant with private rooms
          </QuestionnaireChoice>
          <QuestionnaireChoice value="other">Something else</QuestionnaireChoice>
          <QuestionnaireInput aria-label="Another answer" placeholder="Or describe it…" />
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnaireSubmit>Answer</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  ),
};

const sellItems = [
  { name: "sell", required: true, choices: [{ value: "rooms" }, { value: "food" }] },
] as const;

/** Several answers allowed: checkboxes instead of radio buttons. */
export const MultipleChoice: Story = {
  render: () => (
    <Questionnaire
      className="max-w-lg"
      defaultItem="sell"
      items={sellItems}
      shortcuts="numbers"
      onSubmit={(event) => event.preventDefault()}
    >
      <QuestionnaireItem name="sell" required multiple>
        <QuestionnaireTitle>What do you sell?</QuestionnaireTitle>
        <QuestionnaireDescription>Tick all that apply.</QuestionnaireDescription>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="rooms">Rooms</QuestionnaireChoice>
          <QuestionnaireChoice value="food">Food and drink</QuestionnaireChoice>
          <QuestionnaireInput aria-label="Another answer" placeholder="Or write your own…" />
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnaireSubmit>Answer</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  ),
};
