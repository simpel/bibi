# The conversational change layer: previews and change sets

Current behaviour. Why: ADR 0049 (with 0007 and 0003).

## Previews
- `previewChange({ operation, input, context })` runs the command's handler with the same input check and permission as `execute`, inside a transaction that is always rolled back. The changes the handler records for the audit log become the preview: per record its kind (create, update, archive), its name and the changed fields by path, before and after. Bookkeeping fields (ids, timestamps, `organizationId`) are left out; array entries are matched by id (`setups.<setupId>.capacity`).
- Ids are resolved to the organization's names server-side, so the card says "Boardroom", not an id.
- An operation may declare `consequences({ input, context })`: what the change affects beyond its own fields, read before it runs, as an i18n key with values and a severity (`info` or `warning`). Examples: a new item price does not reach existing quote lines (snapshots); archiving a status or state moves its tickets or lines and clears grid cells. An unknown key shows a generic line. Add consequences per operation as needed.
- The preview carries the change's feature group (`group`), so the card can say it needs an admin.
- The MCP server computes the preview when it creates a proposal, so a command that would fail fails there and the user is never asked to confirm something that cannot run. The preview is display only; the signed approval token still binds the exact input that runs.
- Handlers that can be previewed must not make external calls; those go in `external`, which runs after commit (ADR 0058).

## The approval card
- Shows a table of changed fields (field, before, after) with names and amounts formatted, the consequences, and a "Needs admin" badge for configuration changes. Buttons: Cancel and Confirm. When a consequence is a warning, Confirm stays disabled until the user ticks "I understand what this affects". Proposals stored before previews existed still show their input.

## Change sets
- `changeSet.apply({ title, steps: [{ operation, input }] })` runs several commands in one transaction behind one approval. Each step is authorized and validated as its own operation; if one fails, nothing is saved. Audit rows name each step's own operation.
- A step may use an earlier step's output with `"$step:<n>.<path>"` (e.g. the id of an item created in step 0 as a part in step 2).
- Only commands that need approval can be steps; queries, change sets themselves and commands the AI may never run are refused. The card lists every step's changes under one Confirm.
