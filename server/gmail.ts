// Gmail integration via Replit Connectors SDK (google-mail)
import { ReplitConnectors } from "@replit/connectors-sdk";

const NOTIFY_ADDRESSES = [
  "Austinpacholek2014@gmail.com",
  "jpacholek04@gmail.com",
  "pachdillon@yahoo.com",
  "jcondren99@msn.com",
];

function buildRawMessage(to: string[], subject: string, body: string): string {
  const toHeader = to.join(", ");
  const message = [
    `To: ${toHeader}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  prayerRequest?: boolean | null;
}): Promise<void> {
  const connectors = new ReplitConnectors();

  const tag = data.prayerRequest ? "Prayer Request" : "Contact Form";

  const emailBody = [
    `New ${tag} submission from fpcd.life`,
    ``,
    `Name:    ${data.name}`,
    `Email:   ${data.email}`,
    `Phone:   ${data.phone || "Not provided"}`,
    `Type:    ${tag}`,
    ``,
    `Message:`,
    `${data.message}`,
    ``,
    `---`,
    `Sent from the First Pentecostal Church of Dallas website.`,
  ].join("\n");

  const raw = buildRawMessage(
    NOTIFY_ADDRESSES,
    `[FPCD ${tag}] ${data.name}`,
    emailBody
  );

  const response = await connectors.proxy(
    "google-mail",
    "/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gmail send failed (${response.status}): ${err}`);
  }
}
