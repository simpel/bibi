"use client";

import { Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import {
  hasAction,
  MATRIX_ACTIONS,
  MATRIX_RESOURCES,
  type PermissionActionValue,
  type PermissionSetValue,
  type ResourceKey,
  toggleAction,
} from "../permission-model";

export type PermissionMatrixProps = {
  value: PermissionSetValue;
  onChange: (value: PermissionSetValue) => void;
  /** Owner row: everything granted, nothing editable. */
  readOnly?: boolean;
};

/** Resource × read/write/admin grid; a stronger action implies the weaker ones. */
export function PermissionMatrix(props: PermissionMatrixProps) {
  const t = useTranslations("role");
  return (
    <Table data-slot="permission-matrix">
      <TableHeader>
        <TableRow>
          <TableHead>{t("matrix.resource")}</TableHead>
          {MATRIX_ACTIONS.map((action) => (
            <TableHead key={action} className="text-center">
              {t(`actions.${action}`)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {MATRIX_RESOURCES.map((resource) => (
          <TableRow key={resource}>
            <TableCell className="font-medium">{t(`resources.${resource}`)}</TableCell>
            {MATRIX_ACTIONS.map((action) => (
              <MatrixCell key={action} resource={resource} action={action} {...props} />
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type MatrixCellProps = PermissionMatrixProps & {
  resource: ResourceKey;
  action: PermissionActionValue;
};

function MatrixCell({ value, onChange, readOnly = false, resource, action }: MatrixCellProps) {
  const t = useTranslations("role");
  return (
    <TableCell className="text-center">
      <Checkbox
        disabled={readOnly}
        aria-label={`${t(`resources.${resource}`)}: ${t(`actions.${action}`)}`}
        checked={readOnly || hasAction({ permissions: value, resource, action })}
        onCheckedChange={(checked) =>
          onChange(
            toggleAction({ permissions: value, resource, action, checked: checked === true }),
          )
        }
      />
    </TableCell>
  );
}
