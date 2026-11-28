"use client";

import {
  Button,
  Form,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@bibi/ui";
import { PencilRulerIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { layoutsRoute } from "@/features/floor-plan/layouts-path";
import { PICK_COLORS } from "@/features/reservation/lib/pick-colors";
import { FloorPlanPanel } from "@/features/reservation/ui/floor-plan-panel";
import { PanZoom } from "@/features/reservation/ui/pan-zoom";
import { Link, useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useToastAction } from "@/lib/use-toast-action";
import { saveTablesAction, setSittingLayoutAction } from "../actions";
import type { TableRow } from "../lib/layout-tables";
import type { SittingTables } from "../lib/sitting-tables";
import { CombinationsEditor } from "./combinations-editor";

type Values = { rows: TableRow[] };

const numberOrNull = ({ value }: { value: string }) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
};

export type SittingTablesEditorProps = {
  itemId: string;
  sitting: SittingTables;
  layouts: readonly { id: string; name: string }[];
  canEdit: boolean;
};

/**
 * One sitting's floor: tap a table to set its number, its people range and whether guests may
 * book it online; join tables below; pick which layout the sitting runs on.
 */
export function SittingTablesEditor({
  itemId,
  sitting,
  layouts,
  canEdit,
}: SittingTablesEditorProps) {
  const t = useTranslations("tableBooking.tables");
  const common = useTranslations("common");
  const router = useRouter();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const form = useForm<Values>({ defaultValues: { rows: [...sitting.tables] } });
  const rows = form.watch("rows");
  const index = rows.findIndex((row) => row.id === pickedId);
  const { run, pending: switching } = useToastAction();
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      saveTablesAction({
        layoutId: sitting.layoutId,
        tables: values.rows.map((row) => ({
          id: row.id,
          label: row.label.trim() === "" ? null : row.label.trim(),
          minCovers: numberOrNull({ value: row.minCovers }),
          maxCovers: numberOrNull({ value: row.maxCovers }),
          onlineBookable: row.onlineBookable,
        })),
      }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.refresh(),
  });
  const elements = sitting.plan.tables.map(({ id, drawing }) => ({
    ...drawing,
    tone:
      rows.find((row) => row.id === id)?.onlineBookable === false
        ? ("muted" as const)
        : ("default" as const),
  }));
  const chooseLayout = ({ layoutId }: { layoutId: string }) =>
    run({
      action: () => setSittingLayoutAction({ id: sitting.sittingId, layoutId }),
      messages: { pending: common("saving"), success: t("layoutSaved") },
      onSuccess: () => router.refresh(),
    });
  const tap = ({ event }: { event: React.MouseEvent<SVGSVGElement> }) => {
    const id = (event.target as Element).closest("[data-id]")?.getAttribute("data-id");
    if (id && sitting.plan.tables.some((table) => table.id === id)) setPickedId(id);
  };
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">{t("layout")}</span>
        <Select
          value={sitting.layoutId}
          disabled={!canEdit || switching}
          onValueChange={(layoutId) => chooseLayout({ layoutId })}
        >
          <SelectTrigger aria-label={t("layout")} className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {layouts.map((layout) => (
              <SelectItem key={layout.id} value={layout.id}>
                {layout.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild variant="outline">
          <Link href={layoutsRoute({ itemId, layoutId: sitting.layoutId })}>
            <PencilRulerIcon />
            {t("editLayout")}
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-[26rem] overflow-hidden rounded-xl border bg-card p-3">
          <PanZoom>
            <FloorPlanPanel
              title={sitting.layoutName}
              plan={sitting.plan}
              elements={elements}
              blocks={[]}
              highlighted={new Set<string>()}
              picked={pickedId ? [{ tableId: pickedId, color: PICK_COLORS[0] }] : []}
              onClick={(event) => tap({ event })}
            />
          </PanZoom>
        </div>
        <Form {...form}>
          <form
            onSubmit={submit}
            noValidate
            className="grid content-start gap-4 rounded-xl border bg-card p-4"
          >
            {index < 0 ? (
              <p className="text-sm text-muted-foreground">{t("tapTable")}</p>
            ) : (
              <fieldset disabled={!canEdit} className="grid gap-4">
                <h4 className="text-lg">{t("tableTitle", { label: rows[index]?.label || "–" })}</h4>
                {(["label", "minCovers", "maxCovers"] as const).map((name) => (
                  <FormController
                    key={`${pickedId}-${name}`}
                    control={form.control}
                    name={`rows.${index}.${name}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t(name)}</FormLabel>
                        <FormControl>
                          <Input {...field} inputMode="numeric" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
                <p className="text-sm text-muted-foreground">
                  {t("seatsLine", { count: rows[index]?.seats ?? 0 })}
                </p>
                <FormController
                  control={form.control}
                  name={`rows.${index}.onlineBookable`}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label={t("online")}
                      />
                      <FormLabel>{t("online")}</FormLabel>
                    </FormItem>
                  )}
                />
              </fieldset>
            )}
            {canEdit ? (
              <Button type="submit" disabled={pending || !form.formState.isDirty}>
                {common("save")}
              </Button>
            ) : null}
          </form>
        </Form>
      </div>
      <div className="grid gap-3">
        <h4 className="text-sm font-medium">{t("combinations")}</h4>
        <CombinationsEditor
          layoutId={sitting.layoutId}
          tables={sitting.tables}
          combinations={sitting.combinations}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
