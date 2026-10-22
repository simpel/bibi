import { SparklesIcon } from "lucide-react";
import { Conversation, ConversationContent } from "../../components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "../../components/ai-elements/message";
import { Badge } from "../../components/badge/badge";
import { AIChatAdvisory } from "./ai-chat-advisory";
import { AIChatFooter } from "./ai-chat-footer";
import { AIChatOccupancyChart } from "./ai-chat-occupancy-chart";

function AIChatBanner() {
  return (
    <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-2.5 text-xs">
      <div className="flex items-center gap-2">
        <SparklesIcon className="size-4 text-primary" />
        <span className="font-serif font-medium text-foreground">Okazi Intelligence</span>
        <span className="text-muted-foreground">
          • Connected to Hesselby Slott booking pipeline & venue availability
        </span>
      </div>
      <Badge variant="outline" className="text-[10px]">
        Model: Claude 3.5 Sonnet
      </Badge>
    </div>
  );
}

function AIChatAssistantTurn() {
  return (
    <Message from="assistant">
      <MessageContent>
        {/* Markdown analysis intro */}
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <SparklesIcon className="size-3.5" />
          <span>Venue Occupancy & Capacity Analysis</span>
        </div>

        <MessageResponse>
          {`I evaluated the 4 event weekends in **November 2026** across your primary event spaces. Projected weekend utilization is **84.5%**, which is **+14% higher** than November 2025.\n\n### Key Findings\n- **Week 46 (Nov 20–22)** is at **peak capacity**: Grand Manor Hall is 100% booked for the *Stockholm Architecture Award*, and Orangeriet is at 96% with a private anniversary gala.\n- **Grand Manor Hall** maintains the highest consistent demand (**91% average** across all 4 weekends).\n- **Library Salon** still has open capacity for intimate dinner tastings or executive offsites on W44 and W47.\n\nHere is the weekend capacity breakdown by venue:`}
        </MessageResponse>

        <AIChatOccupancyChart />
        <AIChatAdvisory />
      </MessageContent>
    </Message>
  );
}

export function AIChatView() {
  return (
    <div className="flex h-full flex-col bg-background">
      <AIChatBanner />

      {/* Main Conversation Stream */}
      <Conversation className="flex-1 overflow-y-auto">
        <ConversationContent className="max-w-3xl py-6">
          {/* Previous Turn: User Prompt */}
          <Message from="user">
            <MessageContent>
              Compare our weekend venue occupancy and ticket volume across the Grand Manor Hall,
              Orangeriet, and Library Salon for November 2026.
            </MessageContent>
          </Message>

          <AIChatAssistantTurn />
        </ConversationContent>
      </Conversation>

      <AIChatFooter />
    </div>
  );
}
