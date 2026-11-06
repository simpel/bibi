import { describe, expect, it } from "vitest";
import {
  renderInvitationEmail,
  renderMagicLinkEmail,
  renderReminderEmail,
  renderSeatRequestEmail,
} from "../src/index";

describe("Email templates design and typography", () => {
  it("renders Magic Link email in Swedish and English with site branding", () => {
    const sv = renderMagicLinkEmail({
      url: "https://bibi.test/login/magic?token=xyz",
      locale: "sv",
    });
    expect(sv.subject).toBe("Logga in i Bibi");
    expect(sv.text).toContain("https://bibi.test/login/magic?token=xyz");
    expect(sv.text).toContain("Klicka på knappen nedan för att logga in i Bibi");
    expect(sv.html).toContain("#fdfcfa"); // Site canvas background
    expect(sv.html).toContain("#000000"); // Pitch black heading
    expect(sv.html).toContain("Fraunces"); // Serif heading font
    expect(sv.html).toContain("#1a4e30"); // Nordic Spruce primary button
    expect(sv.html).toContain("#fdfaf4"); // Linen ivory button text
    expect(sv.html).toContain("wordmark.png"); // Bibi logo
    expect(sv.html).toContain("https://bibi.test/login/magic?token=xyz");

    const en = renderMagicLinkEmail({
      url: "https://bibi.test/login/magic?token=xyz",
      locale: "en",
    });
    expect(en.subject).toBe("Sign in to Bibi");
    expect(en.text).toContain("Click the button below to sign in to Bibi");
    expect(en.html).toContain("Sign in to Bibi");
  });

  it("renders Invitation email with button and manual join code", () => {
    const sv = renderInvitationEmail({
      inviter: "Anna",
      organization: "World of Volvo",
      url: "https://bibi.test/accept-invitation/inv-123",
      code: "VOLVO26",
      locale: "sv",
    });
    expect(sv.subject).toBe("Inbjudan till World of Volvo i Bibi");
    expect(sv.text).toContain("Anna har bjudit in dig till World of Volvo.");
    expect(sv.text).toContain("https://bibi.test/accept-invitation/inv-123");
    expect(sv.text).toContain("VOLVO26");
    expect(sv.html).toContain("Anna har bjudit in dig till World of Volvo");
    expect(sv.html).toContain("Acceptera inbjudan");
    expect(sv.html).toContain("VOLVO26");
    expect(sv.html).toContain("#f5f3f0"); // Code card

    const en = renderInvitationEmail({
      inviter: "Anna",
      organization: "World of Volvo",
      url: "https://bibi.test/accept-invitation/inv-123",
      code: "VOLVO26",
      locale: "en",
    });
    expect(en.subject).toBe("Invitation to World of Volvo on Bibi");
    expect(en.text).toContain("Anna has invited you to World of Volvo.");
    expect(en.html).toContain("Anna invited you to World of Volvo");
    expect(en.html).toContain("Accept invitation");
  });

  it("renders Seat Request email to admin", () => {
    const sv = renderSeatRequestEmail({
      who: "Erik",
      organization: "Acme Corp",
      inviteeEmail: "newhire@acme.test",
      url: "https://bibi.test/acme-corp/settings/billing",
      adminName: "Maria",
      locale: "sv",
    });
    expect(sv.subject).toBe("En användarplats väntar på ditt godkännande i Acme Corp");
    expect(sv.text).toContain("Hej Maria,");
    expect(sv.text).toContain("Erik har bjudit in newhire@acme.test till Acme Corp i Bibi");
    expect(sv.html).toContain("Hej Maria,");
    expect(sv.html).toContain("Hantera förfrågan");

    const en = renderSeatRequestEmail({
      who: "Erik",
      organization: "Acme Corp",
      inviteeEmail: "newhire@acme.test",
      url: "https://bibi.test/acme-corp/settings/billing",
      adminName: "Maria",
      locale: "en",
    });
    expect(en.subject).toBe("A seat is waiting for your approval in Acme Corp");
    expect(en.text).toContain("Hi Maria,");
    expect(en.html).toContain("Review seat request");
  });

  it("renders Billing Reminder email to admin", () => {
    const sv = renderReminderEmail({
      who: "Erik",
      organization: "Acme Corp",
      url: "https://bibi.test/acme-corp/billing/pay",
      adminName: "Maria",
      locale: "sv",
    });
    expect(sv.subject).toBe("Ditt team väntar på att komma tillbaka in i Bibi");
    expect(sv.text).toContain("Hej Maria,");
    expect(sv.text).toContain("Erik försökte precis öppna Bibi för Acme Corp");
    expect(sv.html).toContain("Lägg till betalningsuppgifter");

    const en = renderReminderEmail({
      who: "Erik",
      organization: "Acme Corp",
      url: "https://bibi.test/acme-corp/billing/pay",
      adminName: "Maria",
      locale: "en",
    });
    expect(en.subject).toBe("Your team is waiting to get back into Bibi");
    expect(en.text).toContain("Hi Maria,");
    expect(en.html).toContain("Add payment details");
  });
});
