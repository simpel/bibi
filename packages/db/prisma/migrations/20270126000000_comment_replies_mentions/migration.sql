-- AlterEnum
ALTER TYPE "NotificationKind" ADD VALUE 'COMMENT_MENTIONED';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "parentCommentId" TEXT;

-- CreateTable
CREATE TABLE "CommentMention" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "CommentMention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommentMention_organizationId_userId_idx" ON "CommentMention"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentMention_commentId_userId_key" ON "CommentMention"("commentId", "userId");

-- CreateIndex
CREATE INDEX "Comment_organizationId_parentCommentId_idx" ON "Comment"("organizationId", "parentCommentId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentCommentId_organizationId_fkey" FOREIGN KEY ("parentCommentId", "organizationId") REFERENCES "Comment"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentMention" ADD CONSTRAINT "CommentMention_commentId_organizationId_fkey" FOREIGN KEY ("commentId", "organizationId") REFERENCES "Comment"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

