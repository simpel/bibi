-- Customer types always carry business or private, every other base none (like resourceKind).
ALTER TABLE "EntityType" ADD CONSTRAINT "EntityType_buyerKind_customer_only"
  CHECK (("base" = 'CUSTOMER') = ("buyerKind" IS NOT NULL));
