import { afterEach, describe, expect, it } from "vitest";
import {
  createMemoryMailProvider,
  type ReservationMailInput,
  type ReservationMailKind,
  renderReservationEmail,
  sendReservationMail,
  setMailProvider,
} from "../src/index";

const KINDS: ReservationMailKind[] = ["confirmation", "changed", "cancelled", "reminder"];

const base: ReservationMailInput = {
  kind: "confirmation",
  locale: "en",
  to: "anna@example.com",
  restaurant: {
    name: "Kajen",
    phone: "031-123 45",
    email: "hello@kajen.test",
    policy: "Be on time.",
  },
  reservation: {
    dateLabel: "Friday 4 December",
    timeLabel: "19:30",
    partySize: 2,
    bookerName: "Anna Lind",
    note: "Window seat",
  },
  manageUrl: "https://bibi.test/book/manage/tok123",
  bookUrl: "https://bibi.test/book/kajen/dinner",
};

describe("reservation mail templates", () => {
  for (const locale of ["sv", "en"] as const) {
    for (const kind of KINDS) {
      it(`renders ${kind} in ${locale}`, () => {
        const { to: _to, ...input } = base;
        const mail = renderReservationEmail({ ...input, kind, locale });
        const action = kind === "cancelled" ? base.bookUrl : base.manageUrl;
        expect(mail.subject).toContain("Kajen");
        for (const body of [mail.html, mail.text]) {
          expect(body).toContain(action);
          expect(body).toContain("19:30");
          expect(body).toContain("Anna Lind");
          expect(body).toContain("Be on time.");
          expect(body).toContain("hello@kajen.test");
        }
        if (kind === "cancelled") expect(mail.text).not.toContain("tok123");
      });
    }
  }

  it("uses the requested subject and language", () => {
    const { to: _to, ...input } = base;
    expect(renderReservationEmail({ ...input }).subject).toBe("Your table at Kajen");
    expect(renderReservationEmail({ ...input, locale: "sv" }).subject).toBe("Ditt bord på Kajen");
  });

  it("escapes HTML in the note, name and restaurant", () => {
    const { to: _to, ...input } = base;
    const mail = renderReservationEmail({
      ...input,
      restaurant: { ...input.restaurant, name: "<b>K</b>" },
      reservation: {
        ...input.reservation,
        note: "<script>alert(1)</script>",
        bookerName: "<img src=x onerror=1>",
      },
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).not.toContain("<img src=x");
    expect(mail.html).not.toContain("<b>K</b>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("uses the accent colour and logo when given, falls back otherwise", () => {
    const { to: _to, ...input } = base;
    const branded = renderReservationEmail({
      ...input,
      restaurant: {
        ...input.restaurant,
        accentColor: "#8a1c3c",
        logoUrl: "https://cdn.test/logo.png",
      },
    });
    expect(branded.html).toContain("#8a1c3c");
    expect(branded.html).toContain("https://cdn.test/logo.png");
    const plain = renderReservationEmail({ ...input });
    expect(plain.html).toContain("#1a4e30");
    expect(plain.html).not.toContain("#8a1c3c");
    const bad = renderReservationEmail({
      ...input,
      restaurant: { ...input.restaurant, accentColor: "red;} body{display:none" },
    });
    expect(bad.html).not.toContain("display:none");
  });

  describe("sendReservationMail", () => {
    afterEach(() => setMailProvider({ provider: undefined }));

    it("sends the rendered mail with the restaurant as reply-to", async () => {
      const memory = createMemoryMailProvider();
      setMailProvider({ provider: memory.provider });
      const result = await sendReservationMail(base);
      expect(result.ok).toBe(true);
      expect(memory.outbox).toHaveLength(1);
      expect(memory.outbox[0]?.to).toBe("anna@example.com");
      expect(memory.outbox[0]?.subject).toBe("Your table at Kajen");
      expect(memory.outbox[0]?.replyTo).toBe("hello@kajen.test");
    });
  });
});
