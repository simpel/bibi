import {
  AlertCircleIcon,
  CalendarIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  SparklesIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  XAxis,
  YAxis,
} from "recharts";
import { Conversation, ConversationContent } from "../../components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "../../components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "../../components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "../../components/ai-elements/suggestion";
import { Badge } from "../../components/badge/badge";
import { Button } from "../../components/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card/card";
import { ChartContainer, chartSeriesColor } from "../../components/chart/chart";

const weekendOccupancyData = [
  { week: "W44 (Nov 6–8)", grandManor: 88, orangeriet: 72, librarySalon: 55 },
  { week: "W45 (Nov 13–15)", grandManor: 94, orangeriet: 85, librarySalon: 60 },
  { week: "W46 (Nov 20–22)", grandManor: 100, orangeriet: 96, librarySalon: 80 },
  { week: "W47 (Nov 27–29)", grandManor: 82, orangeriet: 75, librarySalon: 45 },
];

export function AIChatView() {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top Banner / AI Context Indicator */}
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

          {/* Assistant Turn with Inline Chart */}
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

              {/* Inline Interactive Chart */}
              <Card className="my-2 border border-border/80 shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-medium">
                        November Weekend Occupancy Rate
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Percentage of available seating capacity booked per weekend
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      Hesselby Slott
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <ChartContainer label="November weekend occupancy rate by hall">
                    <BarChart
                      data={weekendOccupancyData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="week" tickLine={false} axisLine={false} />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tickLine={false}
                        axisLine={false}
                        width={38}
                      />
                      <ChartTooltip formatter={(value) => [`${value}%`, ""]} />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Bar
                        name="Grand Manor Hall"
                        dataKey="grandManor"
                        fill={chartSeriesColor({ index: 0 })}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        name="Orangeriet"
                        dataKey="orangeriet"
                        fill={chartSeriesColor({ index: 1 })}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        name="Library Salon"
                        dataKey="librarySalon"
                        fill={chartSeriesColor({ index: 2 })}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Operational Advisory Callout */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircleIcon className="size-4 text-amber-600 dark:text-amber-400" />
                  <span>Catering & Service Buffer Advisory for Week 46</span>
                </div>
                <p className="mt-1 leading-relaxed text-muted-foreground dark:text-amber-300/80">
                  Total dinner covers for Saturday, Nov 21 will exceed <strong>420 guests</strong>.
                  Per estate guidelines, kitchen prep requires locking dietary confirmations by{" "}
                  <strong>Nov 13</strong> and scheduling{" "}
                  <strong>+2 back-of-house culinary hands</strong>.
                </p>
              </div>

              {/* Interactive Follow-up Action Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <FileSpreadsheetIcon className="size-3.5 text-primary" />
                  <span>Generate Kitchen Staffing Runsheet</span>
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <CalendarIcon className="size-3.5" />
                  <span>Check Orangeriet Turnover Buffer</span>
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-muted-foreground">
                  <DownloadIcon className="size-3.5" />
                  <span>Export Report</span>
                </Button>
              </div>
            </MessageContent>
          </Message>
        </ConversationContent>
      </Conversation>

      {/* Suggestions and Prompt Input Footer */}
      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <Suggestions>
            <Suggestion suggestion="Which hold options expire this week?" />
            <Suggestion suggestion="Show dietary allergy breakdown for W46" />
            <Suggestion suggestion="Compare November revenue against last year" />
          </Suggestions>

          <PromptInput onSubmit={() => undefined}>
            <PromptInputBody>
              <PromptInputTextarea placeholder="Ask Okazi about venue availability, catering orders, runsheets…" />
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
    </div>
  );
}
