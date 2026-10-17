"use server";

import {
  createInquiry,
  type InquiryCreateInput,
  type InquiryDto,
  type InquiryMarkLostInput,
  type InquiryQualifyInput,
  type InquiryUpdateInput,
  markInquiryLost,
  qualifyInquiry,
  updateInquiry,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export async function createInquiryAction({
  input,
}: {
  input: InquiryCreateInput;
}): Promise<ActionResult<InquiryDto>> {
  return toActionResult({ result: await runOperation({ operation: createInquiry, input }) });
}

export async function updateInquiryAction({
  input,
}: {
  input: InquiryUpdateInput;
}): Promise<ActionResult<InquiryDto>> {
  return toActionResult({ result: await runOperation({ operation: updateInquiry, input }) });
}

export async function qualifyInquiryAction({
  input,
}: {
  input: InquiryQualifyInput;
}): Promise<ActionResult<InquiryDto>> {
  return toActionResult({ result: await runOperation({ operation: qualifyInquiry, input }) });
}

export async function markInquiryLostAction({
  input,
}: {
  input: InquiryMarkLostInput;
}): Promise<ActionResult<InquiryDto>> {
  return toActionResult({ result: await runOperation({ operation: markInquiryLost, input }) });
}
