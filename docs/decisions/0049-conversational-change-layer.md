# 0049 – The conversational change layer: previews and change sets

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0007 (AI-first UX), 0048 (access levels, superseded by 0050), 0044 (pipeline setup batch), 0003 (parity)

## Context
- Okazi is a fixed system with a conversation on top. Staff change it by asking: "add two more seats to the Linnea conference room", "create a package with a per-person price for a drink, snacks and an evening booking of the concert hall". Every change is a proposal the user confirms (ADR 0007).
- Other products do the same: Shopify Sidekick stages changes for review, Zendesk Admin Copilot previews configuration changes before the admin approves them, Salesforce Agentforce asks for confirmation and runs as the user. The shared lessons are to show the real effect rather than a summary, to render it from the system rather than the model, to keep the preview free of side effects, and to gate changes but not reads.
- Okazi's approval card showed the proposed input only ("setups: …"), with no before/after and nothing about what else the change touches. A request that needs several commands became several cards, which could be confirmed one by one and leave a half-done change.

## Decision

### Every proposal carries a preview computed by core
- `previewChange({ operation, input, context })` runs the command's handler with the same input check and permission as `execute`, inside a transaction that is always rolled back. The changes the handler records for the audit log become the preview: per record its kind (create, update, archive), its name and the changed fields by path, before and after. Bookkeeping fields (ids, timestamps, `organizationId`) are left out; array entries are matched by their id (`setups.<setupId>.capacity`).
- Ids in the preview are resolved to the organization's own names server-side, so the card says "Boardroom", not an id.
- An operation may declare `consequences({ input, context })`: what the change affects beyond its own fields, read before it runs, as an i18n key with values and a severity (`info` or `warning`). The first ones: an item's new price does not reach existing quote lines (they are snapshots); archiving a phase or a state moves its tickets or lines and clears grid cells.
- The preview also carries the change's feature group (ADR 0050, replacing the access level of ADR 0048) as `group`, so the card can say that it needs an admin.
- The MCP server computes the preview when it creates a proposal. A command that would fail fails here, so the user is never asked to confirm something that cannot run. The preview is display only: the signed token still binds the exact input that runs.

### The card shows exactly that
- The approval card shows a table of the changed fields (field, before, after) with names and amounts formatted, the consequences, and a "Needs admin" badge for configuration changes.
- The buttons are Cancel and Confirm. When a consequence is a warning, Confirm stays disabled until the user ticks "I understand what this affects".
- Proposals stored before previews existed still show their input.

### Change sets: one request, one card, all or nothing
- `changeSet.apply({ title, steps: [{ operation, input }] })` runs several commands in one transaction behind one approval, the way `pipelineSetup.activate` already batches the pipeline (ADR 0044). Each step is authorized and validated as its own operation; if one fails, nothing is saved.
- A step may use the output of an earlier step with a reference string `"$step:<n>.<path>"` (e.g. the id of an item created in step 0 as a part of the package in step 2).
- The card lists every step's changes under one Confirm. Audit rows name each step's own operation.
- Only commands that need approval can be steps; queries, change sets themselves and commands the AI may never run are refused.

## Consequences
- The assistant can be trusted with larger requests: what will happen is computed and shown, not described by the model.
- A preview runs the handler once more before the change. That is acceptable for configuration and operational commands; external effects (mail, payments) must stay out of handlers that can be previewed, which is already the rule (they run after commit).
- New consequences are added per operation as they are needed; an unknown key shows a generic line.
