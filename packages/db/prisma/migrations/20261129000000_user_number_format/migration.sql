-- CreateEnum
CREATE TYPE "NumberFormat" AS ENUM ('SPACE_COMMA', 'COMMA_DOT', 'DOT_COMMA', 'SPACE_DOT');

-- CreateEnum
CREATE TYPE "CurrencyDisplay" AS ENUM ('SYMBOL', 'CODE');

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "currencyDisplay" "CurrencyDisplay",
ADD COLUMN     "numberFormat" "NumberFormat";
