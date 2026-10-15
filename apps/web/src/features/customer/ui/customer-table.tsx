import type { CustomerDto, EntityTypeDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { customerRoute } from "@/lib/routes";

export type CustomerTableProps = { customers: CustomerDto[]; types: EntityTypeDto[] };

/** Customer rows: name (link to the detail page), type, city and email. */
export async function CustomerTable({ customers, types }: CustomerTableProps) {
  const t = await getTranslations("customer");
  const typeName = ({ id }: { id: string }) => types.find((type) => type.id === id)?.name ?? "–";
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.type")}</TableHead>
          <TableHead>{t("columns.city")}</TableHead>
          <TableHead>{t("columns.email")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">
              <Link href={customerRoute({ id: customer.id })} className="hover:underline">
                {customer.name}
              </Link>
            </TableCell>
            <TableCell>{typeName({ id: customer.entityTypeId })}</TableCell>
            <TableCell>{customer.invoiceCity ?? "–"}</TableCell>
            <TableCell>{customer.email ?? "–"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
