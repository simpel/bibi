import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select/select";

export type DataTablePageSizeProps = {
  pageSize: number;
  pageSizeOptions: number[];
  label: string;
  onChange: (pageSize: number) => void;
};

export function DataTablePageSize(props: DataTablePageSizeProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{props.label}</span>
      <Select value={String(props.pageSize)} onValueChange={(next) => props.onChange(Number(next))}>
        <SelectTrigger aria-label={props.label} className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {props.pageSizeOptions.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
