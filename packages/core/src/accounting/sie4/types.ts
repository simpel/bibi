/** A SIE object (dimension 6 = project, SIE 4B §8): here an order, by its reference. */
export type SieObject = { dimension: number; id: string; name: string };

/** One `#TRANS`: debit is positive, credit negative (SIE 4B `#TRANS`). */
export type SieTransaction = {
  account: string;
  amountMinor: number;
  objects?: readonly Pick<SieObject, "dimension" | "id">[];
};

/** One `#VER`. Series and number stay empty: the accounting program assigns them (4I). */
export type SieVoucher = {
  /** `YYYY-MM-DD` in the organization's zone. */
  date: string;
  text: string;
  transactions: readonly SieTransaction[];
};

export type SieAccount = { number: string; name: string };

/** Everything one SIE 4I file says (ADR 0077). */
export type SieFile = {
  programName: string;
  programVersion: string;
  /** `YYYY-MM-DD`, when the file was generated. */
  generatedOn: string;
  orgNumber: string;
  companyName: string;
  /** The current fiscal year, `YYYY-MM-DD` both inclusive. */
  fiscalYear: { start: string; end: string };
  accounts: readonly SieAccount[];
  objects: readonly SieObject[];
  vouchers: readonly SieVoucher[];
};
