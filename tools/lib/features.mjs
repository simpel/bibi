// Feature-mappar: <paket>/src/features/<entitet>/ och krav på filer i dem.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Lista över feature-mappar i ett paket, t.ex. packages/core/src/features/venue.
export function listFeatureDirs({ root, pkg }) {
  const featuresDir = join(root, pkg, "src", "features");
  if (!existsSync(featuresDir)) return [];
  return readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

// requiredFiles: { "<paket>": ["fil.ts", ...] }. Paket som inte finns i kartan kontrolleras inte.
// corePackage: paketet som definierar entiteterna. Varje entitet där måste finnas i kärnan.
export function checkFeatures({ root, requiredFiles, corePackage }) {
  const problems = [];
  const coreEntities = listFeatureDirs({ root, pkg: corePackage });
  for (const pkg of Object.keys(requiredFiles)) {
    const entities = listFeatureDirs({ root, pkg });
    const hasFeatures = existsSync(join(root, pkg, "src", "features"));
    if (pkg !== corePackage && hasFeatures) {
      for (const entity of entities) {
        if (!coreEntities.includes(entity)) {
          problems.push({
            file: `${pkg}/src/features/${entity}`,
            message: `saknas i ${corePackage}/src/features`,
          });
        }
      }
    }
    // Adapter-paket ska ha en fil för varje kärnentitet, så länge paketet har src/features.
    const wanted = pkg === corePackage ? entities : coreEntities;
    for (const entity of hasFeatures ? wanted : []) {
      problems.push(...missingFiles({ root, pkg, entity, files: requiredFiles[pkg] }));
    }
  }
  return { entityCount: coreEntities.length, problems };
}

function missingFiles({ root, pkg, entity, files }) {
  const dir = `${pkg}/src/features/${entity}`;
  return files
    .filter((file) => !existsSync(join(root, dir, file)))
    .map((file) => ({ file: dir, message: `saknar ${file}` }));
}
