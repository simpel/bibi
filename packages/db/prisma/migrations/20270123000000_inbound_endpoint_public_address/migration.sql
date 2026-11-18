-- The organization's own address that forwards to its inbox address (shown in the setup steps).
ALTER TABLE "InboundEndpoint" ADD COLUMN "publicAddress" TEXT;
