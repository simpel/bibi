/// {{Pascal}} (ADR 0006). TODO: add domain fields and relations, then run pnpm db:generate and pnpm --filter @bibi/db migrate:dev.
model {{Pascal}} {
  id             String       @id @default(cuid(2))
  organizationId String
  name           String
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  createdBy      String?

  @@unique([id, organizationId])
  @@index([organizationId, status])
}
