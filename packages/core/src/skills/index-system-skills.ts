import { type Db, deleteEmbedding, GLOBAL_EMBEDDING_SCOPE, upsertEmbedding } from "@okazi/db";
import { skillEmbeddable } from "../features/skill/embeddable";
import { contentHash } from "../search/content-hash";
import type { EmbedFn } from "../search/embed";

export type IndexSystemSkillsInput = {
  db: Db;
  embed: EmbedFn;
  /** Only these SYSTEM skills (default: all). */
  skillIds?: readonly string[];
};

const scope = { organizationId: GLOBAL_EMBEDDING_SCOPE, entityType: "skill", isRecord: false };

/** Indexes SYSTEM skills once, globally; every org's `search` includes these rows. */
export async function indexSystemSkills({
  db,
  embed,
  skillIds,
}: IndexSystemSkillsInput): Promise<void> {
  const ids = skillIds ? { id: { in: [...skillIds] } } : {};
  const skills = await db.skill.findMany({ where: { scope: "SYSTEM", ...ids } });
  for (const skill of skills) {
    if (skill.status === "ARCHIVED") {
      await deleteEmbedding({ db, ...scope, entityId: skill.id });
      continue;
    }
    const content = skillEmbeddable.toText({ entity: skill });
    const hash = contentHash({ text: content });
    const existing = await db.embedding.findFirst({
      where: { organizationId: scope.organizationId, entityType: "skill", entityId: skill.id },
      select: { contentHash: true },
    });
    if (existing?.contentHash === hash) continue;
    const { model, embeddings } = await embed({ texts: [content] });
    const [embedding] = embeddings;
    if (!embedding) continue;
    await upsertEmbedding({
      db,
      ...scope,
      entityId: skill.id,
      model,
      content,
      contentHash: hash,
      embedding,
    });
  }
}
