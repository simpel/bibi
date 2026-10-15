# Backup container (ADR 0013): pg_dump matching the server version plus an S3 client.
FROM pgvector/pgvector:pg17
RUN apt-get update \
  && apt-get install -y --no-install-recommends awscli ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY docker/backup/backup.sh docker/backup/loop.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/loop.sh
ENTRYPOINT ["/usr/local/bin/loop.sh"]
