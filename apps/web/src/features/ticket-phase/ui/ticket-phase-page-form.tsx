"use client";

import type { TicketPhaseDto } from "@bibi/core/schemas";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { TicketPhaseForm } from "./ticket-phase-form";

export type TicketPhasePageFormProps = { phase?: TicketPhaseDto | undefined };

/** The phase form on its create or update page; saving (or cancelling) goes back to the list. */
export function TicketPhasePageForm({ phase }: TicketPhasePageFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <TicketPhaseForm phase={phase} onDone={() => router.push(ROUTES.settingsPipeline)} />
    </div>
  );
}
