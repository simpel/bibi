import type { Meta, StoryObj } from "@storybook/react-vite";
import { SparklesIcon } from "lucide-react";
import { Conversation, ConversationContent, ConversationEmptyState } from "./conversation";
import { Message, MessageContent, MessageResponse } from "./message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "./prompt-input";
import { Suggestion, Suggestions } from "./suggestion";

const meta = { title: "Components/AI Elements" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chat: Story = {
  render: () => (
    <div className="flex h-96 flex-col rounded-lg border">
      <Conversation>
        <ConversationContent>
          <Message from="user">
            <MessageContent>Show all venues</MessageContent>
          </Message>
          <Message from="assistant">
            <MessageContent>
              <MessageResponse>
                {"There are **3** venues:\n\n- Hall A\n- Hall B\n- Hall C"}
              </MessageResponse>
            </MessageContent>
          </Message>
        </ConversationContent>
      </Conversation>
      <div className="p-3">
        <PromptInput onSubmit={() => undefined}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Ask something…" />
          </PromptInputBody>
          <PromptInputFooter>
            <span />
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <ConversationEmptyState
      title="What can I help you with?"
      description="I can search, show and propose changes."
      icon={<SparklesIcon className="size-6" />}
    >
      <Suggestions>
        <Suggestion suggestion="Show all venues" />
        <Suggestion suggestion="Which skills are available?" />
      </Suggestions>
    </ConversationEmptyState>
  ),
};
