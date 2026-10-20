# ADR triage

Sorted from headings and size, so verify each ADR while migrating it. Policy: root `CLAUDE.md`, "Conventions".

Rule of thumb: an ADR stays a decision record only if it names a rejected alternative or a costly reversal. A rule goes to the nearest `CLAUDE.md` with `Why: ADR NNNN`. A spec goes to `docs/domain-model.md` or the package, and the ADR keeps one paragraph.

Only 0012 and 0059 have an "Alternatives" section. Most of the rest are rules or specs.

## 1. Keep as decision records (short, no change)
0001, 0002, 0003, 0007, 0013, 0023, 0024, 0025, 0027, 0030, 0031, 0033, 0042, 0058, 0060, 0012 (has alternatives).

## 2. Rule: move the rule to a `CLAUDE.md`, keep a 1-paragraph ADR
| ADR | Rule goes to |
|---|---|
| 0005 authentication | `packages/auth/CLAUDE.md` (already there) |
| 0006 database conventions | `packages/db/CLAUDE.md` (already there) |
| 0009 language | root `CLAUDE.md` (already there) |
| 0010 web data access | `apps/web/CLAUDE.md` (done) |
| 0014 system logging | `packages/logger/CLAUDE.md` (already there) |
| 0015 platform admin | `packages/core/CLAUDE.md`, `apps/web/CLAUDE.md` (done) |
| 0035, 0036, 0041 navigation and views | `apps/web/CLAUDE.md` |
| 0038 page width | `apps/web/CLAUDE.md` (done) |
| 0040 data tables | `apps/web/CLAUDE.md` (done) |
| 0039, 0046 user preferences and settings | `packages/core/CLAUDE.md` (`self` scope, done) |
| 0032 audit retention, 0037 public docs | the owning package, when touched |
| 0051 single source of truth | root `CLAUDE.md` (done) |

## 3. Spec: move the spec out, keep the decision paragraph
Highest value first. These have addenda or amendments, so the truth is spread over several sections.

| ADR | Words | Spec goes to |
|---|---|---|
| 0044 line states and phase grid | 1453 | `docs/domain-model.md` |
| 0059 capabilities, demands, buffers | 1442 | `docs/plans/type-capabilities-and-resources.md` |
| 0050 permission presets | 1286 | `packages/core/src/permissions/` README |
| 0034 roles and responsibilities | 1206 | `docs/domain-model.md` |
| 0045 soft-landing onboarding | 1116 | `docs/domain-model.md` or a web README |
| 0043 tickets and phases | 1090 | `docs/domain-model.md` |
| 0021 configurable items | 976 | `docs/domain-model.md` |
| 0028 payments, 0029 invoicing | 921, 261 | `packages/core` payment feature README |
| 0026 configurable domain implementation | 690 | `packages/core/CLAUDE.md` (rules done), rest to domain model |
| 0049 conversational change layer | 728 | `packages/ai` README |
| 0052, 0053, 0054, 0055, 0056, 0057 | 356–761 | `docs/domain-model.md` |
| 0004 multi-tenancy, 0008 search and skills, 0022 quotes and occupancy | 346–654 | `docs/domain-model.md` or the package |

## 4. Superseded: keep as a stub with a pointer
0011 (by 0021), 0020 (by 0034), 0048 (by 0050).

## Gaps
Numbers 0016–0019 and 0047 do not exist. Do not reuse them.
