/**
 * `AuditLog.organizationId` for platform-level commands (ADR 0015), e.g. changing an AI model.
 * Reserved: `scopedDb` refuses it, so no tenant can ever read or write these rows.
 */
export const PLATFORM_SCOPE = "__platform__";
