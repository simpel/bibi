import { type Db, deleteEmbedding, GLOBAL_EMBEDDING_SCOPE, upsertEmbedding } from "@okazi/db";
import { skillEmbeddable } from "../features/skill/embeddable";
import { contentHash } from "../search/content-hash";
import type { EmbedFn } from "../search/embed";

export type IndexSystemSkillsInput = { db: Db; embed: EmbedFn };

const scope = { organizationId: GLOBAL_EMBEDDING_SCOPE, entityType: "skill" };

/** Indexes SYSTEM skills once, globally; every org's `search` includes these rows. */
export async function indexSystemSkills({ db, embed }: IndexSystemSkillsInput): Promise<void> {
  const skills = await db.skill.findMany({ where: { scope: "SYSTEM" } });
  for (const skill of skills) {
    if (skill.status === "ARCHIVED") {
      await deleteEmbedding({ db, ...scope, entityId: skill.id });
      continue;
    }
    const content = skillEmbeddable.toText({ entity: skill });
    const hash = contentHash({ text: content });
    const existing = await db.embedding.findFirst({
      where: { ...scope, entityId: skill.id },
      select: { contentHash: true },
    });
    if (existing?.contentHash === hash) continue;
    const { model, embeddings } = await embed({ texts: [content] });
    const [embedding] = embeddings;
    if (!embedding) continue;
    await upsertEmbedding({ db, ...scope, entityId: skill.id, model, content, contentHash: hash, embedding });
  }
}
