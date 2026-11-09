import { Socket } from "node:net";
import { createSecureContext, TLSSocket } from "node:tls";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";

const invalid = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "VALIDATION", message }) });

export type CertificateNumberInput = { certificate: string; passphrase: string };

/**
 * The Swish number a merchant certificate was issued to: Swish puts it in the subject's common
 * name. The .p12 is opened by Node's TLS (no PKCS#12 library): a secure context loads it and an
 * unconnected TLS socket reports its own certificate. VALIDATION when it cannot be opened.
 */
export function certificateNumber({
  certificate,
  passphrase,
}: CertificateNumberInput): Result<string> {
  let socket: TLSSocket | undefined;
  try {
    const pfx = Buffer.from(certificate.replace(/\s+/g, ""), "base64");
    socket = new TLSSocket(new Socket(), {
      secureContext: createSecureContext({ pfx, passphrase }),
    });
    const own = socket.getCertificate();
    const name = own && "subject" in own ? own.subject?.CN : undefined;
    const number = (Array.isArray(name) ? name[0] : name)?.replace(/\D/g, "");
    return number
      ? ok({ value: number })
      : invalid({ message: "The certificate names no Swish number" });
  } catch {
    return invalid({ message: "The certificate or passphrase could not be opened" });
  } finally {
    socket?.destroy();
  }
}
