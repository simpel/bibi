-- The ticket → order rename (20270101000000) renamed the enums but not the same names stored
-- inside JSON: run sheet rows still say kind "TICKET", and status-change notifications still carry
-- ticketReference/ticketTitle. Rewrite them to the new names. Audit and system logs stay as they
-- were written (history, append-only).

UPDATE "RunSheet"
SET "content" = jsonb_set(
  "content",
  '{rows}',
  (
    SELECT jsonb_agg(
      CASE WHEN row->>'kind' = 'TICKET' THEN jsonb_set(row, '{kind}', '"ORDER"') ELSE row END
      ORDER BY position
    )
    FROM jsonb_array_elements("content"->'rows') WITH ORDINALITY AS rows(row, position)
  )
)
WHERE jsonb_typeof("content"->'rows') = 'array'
  AND jsonb_array_length("content"->'rows') > 0
  AND "content"->'rows' @> '[{"kind": "TICKET"}]';

UPDATE "Notification"
SET "data" = ("data" - 'ticketReference' - 'ticketTitle')
  || CASE WHEN "data" ? 'ticketReference'
       THEN jsonb_build_object('orderReference', "data"->'ticketReference') ELSE '{}'::jsonb END
  || CASE WHEN "data" ? 'ticketTitle'
       THEN jsonb_build_object('orderTitle', "data"->'ticketTitle') ELSE '{}'::jsonb END
WHERE "data" ? 'ticketReference' OR "data" ? 'ticketTitle';
