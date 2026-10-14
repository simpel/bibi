import { Checkbox, Label } from "@okazi/ui";

export type RoleChecklistProps = {
  roleNames: string[];
  value: string[];
  onChange: (value: string[]) => void;
};

/** One checkbox per assignable role name; the form field holds the checked names. */
export function RoleChecklist({ roleNames, value, onChange }: RoleChecklistProps) {
  const toggle = ({ name, checked }: { name: string; checked: boolean }) =>
    onChange(checked ? [...value, name] : value.filter((current) => current !== name));
  return (
    <ul className="grid gap-2">
      {roleNames.map((name) => (
        <li key={name} className="flex items-center gap-2">
          <Checkbox
            id={`role-${name}`}
            checked={value.includes(name)}
            onCheckedChange={(checked) => toggle({ name, checked: checked === true })}
          />
          <Label htmlFor={`role-${name}`}>{name}</Label>
        </li>
      ))}
    </ul>
  );
}
