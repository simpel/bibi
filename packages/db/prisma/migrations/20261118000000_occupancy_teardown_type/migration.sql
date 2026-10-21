-- ADR 0059: a line's buffer after it. Its own migration, so the value is committed before the
-- next migration's functions use it.

-- AlterEnum
ALTER TYPE "OccupancyType" ADD VALUE 'TEARDOWN';
