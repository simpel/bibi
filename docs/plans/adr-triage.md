# ADR triage

Policy: root `CLAUDE.md`, "Conventions". Rules go to the nearest `CLAUDE.md` with `Why: ADR NNNN`. Behaviour specs go to `docs/specs/` (entities stay in `docs/domain-model.md`). An ADR stays a decision record: context, the decision with rejected alternatives, consequences, dated one-line addenda.

## Done: spec moved out, ADR shortened
| ADR | Spec |
|---|---|
| 0043, 0044, 0054 | `docs/specs/tickets-phases-and-states.md` |
| 0034, 0050, 0055 | `docs/specs/permissions.md`, `docs/specs/assignments-and-responsibilities.md` |
| 0021, 0026 | `docs/specs/configurable-domain.md` |
| 0045 | `docs/specs/onboarding.md` |
| 0049 | `docs/specs/change-layer.md` |
| 0028 | `docs/specs/payments.md` |

## Done: stale content fixed or derivable lists removed
0004, 0005, 0006, 0008, 0010, 0012, 0022, 0039. These described removed things (roles by name, `booking-<id>` addresses, `Room`, `self:edit`, history from `AuditLog`) or listed what the code already shows (the `UNSCOPED_MODELS` tables).

## Read and kept as decision records
0052, 0053, 0056, 0057, 0059 (decision, alternatives and consequences; about one page each; 0059 has a plan in `docs/plans/`), 0014, 0015.

## Read in full, then fixed or kept
- Fixed (stale or duplicated content): 0003 (web reads in-process), 0007 (assistant is `/`, models chosen by a superadmin), 0009 (Swedish-docs line and rule list removed), 0013 (staging resolved), 0023 (price is derived, not copied), 0024 (sheets go to a responsibility), 0025 (rewritten short, the spec is `docs/demo-seed.md`), 0027 (only two jobs built), 0035 (dock removed), 0036 (roles and top bar).
- Kept as they are, no drift found: 0001, 0002, 0029, 0030, 0031, 0032, 0033, 0037, 0038, 0040 (its rules also live in `apps/web/CLAUDE.md`), 0041, 0042, 0046, 0051, 0058 (its open item on `paymentAccount.startOnboarding` still holds), 0060.

## Superseded: keep as a stub with a pointer
0011 (by 0021), 0020 (by 0034), 0048 (by 0050).

## Gaps
Numbers 0016–0019 and 0047 do not exist. Do not reuse them.

## Follow-ups
- ADR 0059 describes work that is partly built (bundle expansion, demands, buffers): keep the plan and the ADR in step as slices land.
- Size and function limits apply to code files only, not to `CLAUDE.md`, specs or ADRs. No docs length check is planned.
