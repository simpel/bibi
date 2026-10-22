"use client";

import { Button, Input } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

/** "+ Add another": a name and a button; Enter adds too. */
export function AddTypeInput({ onAdd }: { onAdd: ({ name }: { name: string }) => void }) {
  const t = useTranslations("welcome.setup");
  const id = useId();
  const [name, setName] = useState("");
  const add = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim() });
    setName("");
  };
  return (
    <div className="flex gap-2">
      <label htmlFor={id} className="sr-only">
        {t("newTypeName")}
      </label>
      <Input
        id={id}
        value={name}
        placeholder={t("newTypeName")}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          add();
        }}
      />
      <Button type="button" variant="outline" onClick={add}>
        {t("addAnother")}
      </Button>
    </div>
  );
}
