import { createServer, type Server, type Socket } from "node:net";

export type FakeSmtpServer = { url: string; received: string[]; close: () => Promise<void> };

type SessionInput = { socket: Socket; received: string[] };

/** Answers one SMTP session line by line, collecting each DATA payload into `received`. */
function handleSession({ socket, received }: SessionInput): void {
  let buffer = "";
  let data: string | undefined;
  socket.write("220 fake ESMTP\r\n");
  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let index = buffer.indexOf("\r\n");
    while (index >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      if (data !== undefined) {
        if (line === ".") {
          received.push(data);
          data = undefined;
          socket.write("250 OK queued\r\n");
        } else data += `${line}\n`;
      } else if (/^(EHLO|HELO)/i.test(line)) socket.write("250 fake\r\n");
      else if (/^DATA/i.test(line)) {
        data = "";
        socket.write("354 go ahead\r\n");
      } else if (/^QUIT/i.test(line)) socket.end("221 bye\r\n");
      else socket.write("250 OK\r\n");
      index = buffer.indexOf("\r\n");
    }
  });
}

/** A minimal in-process SMTP server so the SMTP adapter is tested over a real connection. */
export async function startFakeSmtpServer(): Promise<FakeSmtpServer> {
  const received: string[] = [];
  const server: Server = createServer((socket) => handleSession({ socket, received }));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    url: `smtp://127.0.0.1:${port}`,
    received,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
