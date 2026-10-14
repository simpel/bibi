// Namnhantering för gen-verktyget: PascalCase till camelCase, kebab-case och snake_case.
export const ENTITY_NAME = /^[A-Z][A-Za-z0-9]*$/;

export function deriveNames({ name }) {
  const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return {
    Pascal: name,
    camel: name[0].toLowerCase() + name.slice(1),
    kebab,
    snake: kebab.replaceAll("-", "_"),
  };
}

// Ersätter {{nyckel}} i mallen. Okänd nyckel är ett fel i mallen och stoppar generatorn.
export function renderTemplate({ text, names }) {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    if (!(key in names)) throw new Error(`Okänd mallvariabel i tools/templates: ${key}`);
    return names[key];
  });
}
