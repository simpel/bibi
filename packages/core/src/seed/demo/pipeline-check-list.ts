import type { ExecuteContext } from "../../operations/context";
import { checkDemoAllocations } from "./allocation-checks";
import { checkDemoAlternatives } from "./alternative-checks";
import { checkDemoArchive } from "./archive-checks";
import { checkDemoAssignments } from "./assignment-checks";
import { checkDemoBoard } from "./board-checks";
import { checkDemoBoardLayout } from "./board-layout-checks";
import { checkDemoBuffers } from "./buffer-checks";
import { checkDemoBundles } from "./bundle-checks";
import { checkDemoDashboard } from "./dashboard-checks";
import { checkDemoDensity } from "./density-checks";
import { checkDemoEstimates } from "./estimate-checks";
import { checkDemoFactGuards } from "./fact-guard-checks";
import { checkDemoFinance } from "./finance-checks";
import { checkDemoGrid } from "./grid-checks";
import { checkDemoHolds } from "./hold-checks";
import { checkDemoInbox } from "./inbox-checks";
import { checkDemoIntakeCreate } from "./intake-create-checks";
import { checkDemoOptionQuantities } from "./option-quantity-checks";
import { checkDemoPayments } from "./payment-checks";
import { checkDemoPipeline } from "./pipeline-checks";
import { checkDemoPreview } from "./preview-checks";
import { checkDemoPrices } from "./price-checks";
import { checkDemoQuoteEvents } from "./quote-event-checks";
import { checkDemoTemplates } from "./template-checks";
import { checkDemoTickets } from "./ticket-checks";
import type { DemoOrg } from "./types";

type OrgCheck = (input: { context: ExecuteContext; org: DemoOrg }) => Promise<string[]>;

/** The checks that need the pipeline, in order (the archive checks run before the grid moves). */
export const PIPELINE_CHECKS: readonly OrgCheck[] = [
  checkDemoPipeline,
  checkDemoTemplates,
  checkDemoTickets,
  checkDemoBoard,
  checkDemoBoardLayout,
  checkDemoAssignments,
  checkDemoHolds,
  checkDemoAlternatives,
  checkDemoArchive,
  checkDemoQuoteEvents,
  checkDemoEstimates,
  checkDemoFactGuards,
  checkDemoGrid,
  checkDemoPreview,
  checkDemoIntakeCreate,
  checkDemoPrices,
  checkDemoBundles,
  checkDemoOptionQuantities,
  checkDemoBuffers,
  checkDemoAllocations,
  checkDemoPayments,
  checkDemoFinance,
  checkDemoDensity,
  checkDemoDashboard,
  checkDemoInbox,
];
