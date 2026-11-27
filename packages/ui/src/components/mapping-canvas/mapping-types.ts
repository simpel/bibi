export type MappingState = "ok" | "attention" | "unmapped";

export type MappingPurpose = {
  id: string;
  label: string;
  /** Small second line, e.g. "Used when an item type has no own account". */
  hint?: string | undefined;
  /** Required purposes show a small "Required" text from labels.required while unmapped. */
  required?: boolean | undefined;
  /** The mapped account id, or null. */
  accountId: string | null;
  state: MappingState;
  /** Why it needs attention, shown under the label in the warning colour. */
  stateText?: string | undefined;
};

export type MappingAccount = {
  id: string;
  label: string;
  detail?: string | undefined;
  /** Inactive/stale accounts are drawn muted with labels.inactive. */
  inactive?: boolean | undefined;
};

export type MappingCanvasLabels = {
  purposes: string;
  accounts: string;
  required: string;
  inactive: string;
  addAccount: string;
  searchAccounts: string;
  noAccountFound: string;
  chooseAccount: string;
  removeLine: string;
  unmapped: string;
};
