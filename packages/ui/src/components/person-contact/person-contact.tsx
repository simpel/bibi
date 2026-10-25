import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Avatar } from "../avatar/avatar";

export const personContactVariants = cva("flex min-w-0", {
  variants: {
    size: {
      /** Who to reach and how: name, why them, phone and email. */
      default: "items-start gap-3 text-sm",
      /** Dense: name, then why them and the number on one line, for cards and popovers. */
      compact: "items-start gap-2 text-xs",
      /** Who is there: name and role only, for lists of staff. */
      mini: "items-center gap-2 text-xs",
    },
  },
  defaultVariants: { size: "default" },
});

export type PersonContactProps = Omit<ComponentProps<"div">, "children"> &
  VariantProps<typeof personContactVariants> & {
    name: string;
    /** Why this person: a role, a responsibility, "Ticket assignee". */
    description?: string;
    /** Shown in the default size only. */
    phone?: string | null;
    /** Shown in the default size only. */
    email?: string | null;
    photoUrl?: string | null;
    /** Off for people outside the organization (a client's contact): they have no profile. */
    avatar?: boolean;
  };

const linkClass = "w-fit truncate underline underline-offset-2 hover:text-muted-foreground";

function Links({ phone, email }: Pick<PersonContactProps, "phone" | "email">) {
  return (
    <>
      {phone ? (
        <a href={`tel:${phone.replace(/\s/g, "")}`} className={cn(linkClass, "tabular-nums")}>
          {phone}
        </a>
      ) : null}
      {email ? (
        <a href={`mailto:${email}`} className={linkClass}>
          {email}
        </a>
      ) : null}
    </>
  );
}

type LinesProps = Pick<PersonContactProps, "name" | "description" | "phone" | "email" | "size">;

/** Name, then why them and how to reach them, laid out by size. */
function Lines({ name, description, phone, email, size }: LinesProps) {
  return (
    <div className="grid min-w-0">
      <span className="truncate font-medium">{name}</span>
      {size === "compact" ? (
        <span className="flex flex-wrap gap-x-1.5">
          {description ? <span className="text-muted-foreground">{description}</span> : null}
          <Links phone={phone} email={email} />
        </span>
      ) : (
        <>
          {description ? (
            <span className="truncate text-muted-foreground">{description}</span>
          ) : null}
          {size === "mini" ? null : <Links phone={phone} email={email} />}
        </>
      )}
    </div>
  );
}

/** A person as a contact: avatar (for people with a profile), name, why them, how to reach them. */
export function PersonContact({
  name,
  description,
  phone,
  email,
  photoUrl,
  avatar = true,
  size,
  className,
  ...props
}: PersonContactProps) {
  const small = size === "mini" || size === "compact";
  return (
    <div
      data-slot="person-contact"
      className={cn(personContactVariants({ size }), className)}
      {...props}
    >
      {avatar ? <Avatar name={name} photoUrl={photoUrl} size={small ? "sm" : "md"} /> : null}
      <Lines name={name} description={description} phone={phone} email={email} size={size} />
    </div>
  );
}
