// Feature folders: <package>/src/features/<entity>/ and the files required in them.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// List of feature folders in a package, e.g. packages/core/src/features/venue.
export function listFeatureDirs({ root, pkg }) {
  const featuresDir = join(root, pkg, "src", "features");
  if (!existsSync(featuresDir)) return [];
  return readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

// requiredFiles: { "<package>": ["file.ts", ...] }. Packages missing from the map are not checked.
// corePackage: the package that defines the entities. Every entity there must exist in the core.
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
            message: `missing in ${corePackage}/src/features`,
          });
        }
      }
    }
    // Adapter packages must have a file for every core entity, as long as the package has src/features.
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
    .map((file) => ({ file: dir, message: `missing ${file}` }));
}
