// Name handling for the gen tool: PascalCase to camelCase, kebab-case and snake_case.
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

// Replaces {{key}} in the template. An unknown key is a template error and stops the generator.
export function renderTemplate({ text, names }) {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    if (!(key in names)) throw new Error(`Unknown template variable in tools/templates: ${key}`);
    return names[key];
  });
}
