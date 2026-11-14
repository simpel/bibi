"use client";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bibi/ui";
import { ExternalLinkIcon } from "lucide-react";

/** One provider's guide, every text written on the server in the user's language. */
export type ProviderGuide = {
  buttonLabel: string;
  title: string;
  intro: string;
  heading: string;
  needs: readonly string[];
  /** The provider's own help page and the label of its link. */
  url: string;
  openLabel: string;
  closeLabel: string;
};

export type HowToConnectButtonProps = { guide: ProviderGuide; className?: string };

/** "How to connect": what a venue needs in place before connecting, and the provider's own guide. */
export function HowToConnectButton({ guide, className }: HowToConnectButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className={className}>
          {guide.buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{guide.title}</DialogTitle>
          <DialogDescription>{guide.intro}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 text-sm">
          <p className="font-medium">{guide.heading}</p>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            {guide.needs.map((need) => (
              <li key={need}>{need}</li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button asChild variant="outline" className="sm:mr-auto">
            <a href={guide.url} target="_blank" rel="noreferrer">
              {guide.openLabel}
              <ExternalLinkIcon aria-hidden />
            </a>
          </Button>
          <DialogClose asChild>
            <Button type="button">{guide.closeLabel}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
