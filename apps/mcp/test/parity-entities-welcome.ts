import { createMemoryFileStore, DEFAULT_WORKING_HOURS, setFileStore } from "@bibi/core";
import { type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** One row per user or organization, read without an id (ADR 0061). */
type SingletonInput = { name: string; field: string; path: string; write: string; args: object };

function singleton({ name, field, path, write, args }: SingletonInput): ParityEntity {
  return {
    name,
    create: ({ mcp }) => tool({ mcp, name: write, args }),
    viaMcp: ({ mcp }) => tool({ mcp, name: `${name}_get`, args: {} }),
    viaRest: ({ context }) => createRestClient({ context }).get({ path }),
    viaGraph: async ({ context, keys }) =>
      (
        await gqlQuery({
          context,
          query: `query { ${field} { ${keys.join(" ")} } }`,
          variables: {},
        })
      )[field],
  };
}

const DAY_FIELDS = "weekday startMinute endMinute breakStartMinute breakEndMinute";

const workingHours: ParityEntity = {
  ...singleton({
    name: "workingHours",
    field: "workingHours",
    path: "/working-hours",
    write: "workingHours_set",
    args: { days: DEFAULT_WORKING_HOURS },
  }),
  viaGraph: async ({ context }) =>
    (
      await gqlQuery({
        context,
        query: `query { workingHours { days { ${DAY_FIELDS} } } }`,
        variables: {},
      })
    ).workingHours,
};

/** A PNG signature plus a few bytes: enough for `file.upload`'s type check. */
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 7]).toString("base64");

const file: ParityEntity = {
  name: "file",
  create: async ({ mcp }) => {
    setFileStore({ store: createMemoryFileStore() });
    const args = { contentType: "image/png", base64: PNG };
    const { key } = await tool({ mcp, name: "file_upload", args });
    return tool({ mcp, name: "file_get", args: { key } });
  },
  viaMcp: ({ mcp, created }) => tool({ mcp, name: "file_get", args: { key: created.key } }),
  viaRest: ({ context, created }) =>
    createRestClient({ context }).get({ path: `/files?key=${encodeURIComponent(created.key)}` }),
  viaGraph: async ({ context, created, keys }) => {
    const query = `query($k: String!) { file(key: $k) { ${keys.join(" ")} } }`;
    return (await gqlQuery({ context, query, variables: { k: created.key } })).file;
  },
};

/** The caller's profile, working hours and files, and the organization's profile (ADR 0061, 0063). */
export function welcomeEntities(): ParityEntity[] {
  return [
    singleton({
      name: "profile",
      field: "profile",
      path: "/profile",
      write: "profile_update",
      args: { firstName: "Parity", lastName: "Person", phone: "+46 31 123 45 67" },
    }),
    workingHours,
    file,
    singleton({
      name: "organizationProfile",
      field: "organizationProfile",
      path: "/organization-profile",
      write: "organizationProfile_update",
      args: {
        legalName: "Parity AB",
        website: "https://parity.example",
        contactPhone: "031-12 34 56",
      },
    }),
  ];
}
