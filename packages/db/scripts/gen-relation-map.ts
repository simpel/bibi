import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { relationMapSource } from "./relation-map.ts";

const target = join(import.meta.dirname, "..", "src", "scoped", "relation-map.generated.ts");
writeFileSync(target, relationMapSource());
