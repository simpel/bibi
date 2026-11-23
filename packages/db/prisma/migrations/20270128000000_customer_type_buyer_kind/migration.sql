-- Customer types carry business or private; private customers get a personal identity number.
ALTER TABLE "EntityType" ADD COLUMN "buyerKind" "BuyerKind";
ALTER TABLE "Customer" ADD COLUMN "personalIdentityNumber" TEXT;

-- A customer type whose customers are all private is private; every other customer type is business.
UPDATE "EntityType" t
SET "buyerKind" = CASE
  WHEN EXISTS (SELECT 1 FROM "Customer" c WHERE c."entityTypeId" = t."id")
   AND NOT EXISTS (
     SELECT 1 FROM "Customer" c WHERE c."entityTypeId" = t."id" AND c."buyerKind" <> 'PRIVATE'
   )
  THEN 'PRIVATE'::"BuyerKind"
  ELSE 'BUSINESS'::"BuyerKind"
END
WHERE t."base" = 'CUSTOMER';
