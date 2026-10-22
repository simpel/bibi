import { SparklesIcon } from "lucide-react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "../../components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "../../components/ai-elements/suggestion";

export function AIChatFooter() {
  return (
    <div className="border-t border-border bg-background p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        <Suggestions>
          <Suggestion suggestion="Which hold options expire this week?" />
          <Suggestion suggestion="Show dietary allergy breakdown for W46" />
          <Suggestion suggestion="Compare November revenue against last year" />
        </Suggestions>

        <PromptInput onSubmit={() => undefined}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Ask Bibi about venue availability, catering orders, runsheets…" />
          </PromptInputBody>
          <PromptInputFooter>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <SparklesIcon className="size-3" />
              <span>Press Enter to send, Shift+Enter for newline</span>
            </div>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
