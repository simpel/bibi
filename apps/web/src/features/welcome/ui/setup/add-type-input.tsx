"use client";

import { PlusIcon } from "lucide-react";
import { useId, useState } from "react";

export type AddTypeInputProps = {
  onAdd: ({ name }: { name: string }) => void;
  placeholder?: string;
};

/** Inline input as the last item in the list; Enter creates the item. */
export function AddTypeInput({ onAdd, placeholder }: AddTypeInputProps) {
  const id = useId();
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <PlusIcon className="ml-0.5 size-4 shrink-0 text-muted-foreground" />
      <input
        id={id}
        type="text"
        value={name}
        placeholder={placeholder}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          onAdd({ name: trimmed });
          setName("");
        }}
        className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}
