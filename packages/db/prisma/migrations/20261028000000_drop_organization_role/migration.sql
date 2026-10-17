/*
  Warnings:

  - You are about to drop the `organizationRole` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "organizationRole" DROP CONSTRAINT "organizationRole_organizationId_fkey";

-- DropTable
DROP TABLE "organizationRole";
