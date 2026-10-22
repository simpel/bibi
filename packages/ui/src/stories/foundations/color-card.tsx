import type { ColorTokenDef } from "./color-types";

export function ColorCard({ token }: { token: ColorTokenDef }) {
  const hasFg = Boolean(token.fgVariable);
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-xs">
      <div
        className="flex h-24 items-center justify-between p-4"
        style={{
          background: `var(--${token.variable})`,
          color: hasFg ? `var(--${token.fgVariable})` : undefined,
        }}
      >
        <span className="font-serif text-sm font-light tracking-wide">
          {hasFg ? "Aa Sample" : ""}
        </span>
        <span className="rounded bg-black/10 px-2 py-0.5 font-sans text-[10px] backdrop-blur-xs">
          --{token.variable}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between">
          <span className="font-serif text-sm font-normal text-black dark:text-white">
            {token.name}
          </span>
          <span className="font-sans text-xs text-muted-foreground">{token.role}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{token.description}</p>
      </div>
    </div>
  );
}
