import {
  type SavedView,
  type SavedViewNameInput,
  SavedViewNameInputSchema,
} from "@bibi/core/schemas";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { saveSavedViewsAction } from "@/features/user-preference/saved-views-actions";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { addView, renameView, type SavedViewListId } from "./lib/saved-views";

type Common = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: SavedViewListId;
  views: SavedView[];
};

export type SavedViewNameDialogProps = Common &
  ({ mode: "save"; query: string } | { mode: "rename"; viewKey: string; name: string });

/** The views after saving: a new view with the search, or the renamed one. */
function nextViews({ props, name }: { props: SavedViewNameDialogProps; name: string }) {
  if (props.mode === "rename") return renameView({ views: props.views, key: props.viewKey, name });
  const view = { id: crypto.randomUUID(), name, q: props.query };
  return addView({ views: props.views, view });
}

/** Names a view: saves the current search as one, or renames a saved one (a tiny action). */
export function SavedViewNameDialog(props: SavedViewNameDialogProps) {
  const t = useTranslations("common.savedViews");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<SavedViewNameInput>({
    resolver: zodResolver(SavedViewNameInputSchema, useZodMessages()),
    defaultValues: { name: props.mode === "rename" ? props.name : "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      saveSavedViewsAction({
        listId: props.listId,
        views: nextViews({ props, name: values.name }),
      }),
    messages: {
      pending: common("saving"),
      success: t(props.mode === "save" ? "saved" : "renamed"),
    },
    onSuccess: () => {
      form.reset();
      props.onOpenChange(false);
      router.refresh();
    },
  });
  const title = props.mode === "save" ? t("save") : t("renameTitle");
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <TextField form={form} name="name" label={t("name")} required />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {props.mode === "save" ? t("save") : common("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
