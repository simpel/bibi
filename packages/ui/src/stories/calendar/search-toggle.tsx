"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/button/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/popover/popover";
import { SearchField, type SearchFieldProps } from "./availability-filter";

/** A search icon that opens the field in a popover, like the group picker; a dot while searching. */
export function SearchToggle({ query, onQuery }: SearchFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Search"
          aria-expanded={open}
          className="relative shrink-0"
        >
          <SearchIcon aria-hidden />
          {query !== "" ? (
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(18rem,calc(100vw-2rem))] p-2">
        <SearchField query={query} onQuery={onQuery} autoFocus />
      </PopoverContent>
    </Popover>
  );
}
