import { ok, type Result } from "../../errors/result";
import { invalid } from "../../shared/errors";
import { encodeCp437 } from "./cp437";
import type { SieFile, SieTransaction, SieVoucher } from "./types";

/** A field in quotes; `"` and `\` are escaped, line breaks and tabs become spaces (SIE 4B §5). */
export const quote = ({ value }: { value: string }) =>
  `"${value.replace(/[\r\n\t]+/g, " ").replace(/[\\"]/g, (char) => `\\${char}`)}"`;

/** Minor units as an SIE amount: a point and two decimals, minus for credit. */
export const amount = ({ minor }: { minor: number }) => {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
};

/** `YYYY-MM-DD` as SIE's `YYYYMMDD`. */
export const sieDate = ({ value }: { value: string }) => value.replaceAll("-", "");

const transLine = ({ trans }: { trans: SieTransaction }) => {
  const objects = (trans.objects ?? [])
    .map((object) => `${object.dimension} ${quote({ value: object.id })}`)
    .join(" ");
  return `   #TRANS ${trans.account} {${objects}} ${amount({ minor: trans.amountMinor })}`;
};

const voucherLines = ({ voucher }: { voucher: SieVoucher }) => [
  `#VER "" "" ${sieDate({ value: voucher.date })} ${quote({ value: voucher.text })}`,
  "{",
  ...voucher.transactions.map((trans) => transLine({ trans })),
  "}",
];

const headerLines = ({ file }: { file: SieFile }) => [
  "#FLAGGA 0",
  `#PROGRAM ${quote({ value: file.programName })} ${quote({ value: file.programVersion })}`,
  "#FORMAT PC8",
  `#GEN ${sieDate({ value: file.generatedOn })}`,
  "#SIETYP 4",
  `#ORGNR ${file.orgNumber}`,
  `#FNAMN ${quote({ value: file.companyName })}`,
  `#RAR 0 ${sieDate({ value: file.fiscalYear.start })} ${sieDate({ value: file.fiscalYear.end })}`,
  "#KPTYP BAS2014",
  "#VALUTA SEK",
  `#DIM 6 ${quote({ value: "Projekt" })}`,
  ...file.accounts.map((acc) => `#KONTO ${acc.number} ${quote({ value: acc.name })}`),
  ...file.objects.map(
    (obj) => `#OBJEKT ${obj.dimension} ${quote({ value: obj.id })} ${quote({ value: obj.name })}`,
  ),
];

/** VALIDATION naming the first voucher whose transactions do not sum to zero (SIE 4B `#TRANS`). */
export function checkBalanced({ vouchers }: { vouchers: readonly SieVoucher[] }): Result<true> {
  const off = vouchers.find(
    (voucher) => voucher.transactions.reduce((sum, trans) => sum + trans.amountMinor, 0) !== 0,
  );
  if (!off) return ok({ value: true });
  return invalid({ message: `Voucher "${off.text}" on ${off.date} does not balance` });
}

/** The file as SIE 4I text, CRLF line ends. */
export function writeSieText({ file }: { file: SieFile }): Result<string> {
  const balanced = checkBalanced({ vouchers: file.vouchers });
  if (!balanced.ok) return balanced;
  const lines = [
    ...headerLines({ file }),
    ...file.vouchers.flatMap((voucher) => voucherLines({ voucher })),
  ];
  return ok({ value: `${lines.join("\r\n")}\r\n` });
}

/** The file as CP437 bytes, ready to download (ADR 0077). */
export function writeSie({ file }: { file: SieFile }): Result<Uint8Array> {
  const text = writeSieText({ file });
  return text.ok ? ok({ value: encodeCp437({ text: text.value }) }) : text;
}
