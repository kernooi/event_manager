type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type: string;
    content_id?: string;
  }>;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function sendEmail({ to, subject, html, attachments }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      attachments,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend error: ${text}`);
  }
}

export async function sendInviteEmail(params: {
  to: string;
  eventName: string;
  inviteLink: string;
}) {
  const { to, eventName, inviteLink } = params;
  const subject = `You are invited to ${eventName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1b1a18; line-height: 1.6;">
      <h2 style="margin: 0 0 12px;">You are invited to ${eventName}</h2>
      <p>Use the link below to complete your registration.</p>
      <p>
        <a href="${inviteLink}" style="display: inline-block; padding: 12px 18px; background: #1b1a18; color: #f4efe4; text-decoration: none; border-radius: 999px;">
          Complete registration
        </a>
      </p>
      <p style="font-size: 12px; color: #6b5a4a;">If the button does not work, paste this link into your browser:</p>
      <p style="font-size: 12px; color: #6b5a4a;">${inviteLink}</p>
    </div>
  `;

  await sendEmail({ to, subject, html });
}

export async function sendRegistrationEmail(params: {
  to: string;
  eventName: string;
  qrBase64: string;
}) {
  const { to, eventName, qrBase64 } = params;
  const subject = `Registration confirmed for ${eventName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1b1a18; line-height: 1.6;">
      <h2 style="margin: 0 0 12px;">Registration successful</h2>
      <p>Your registration for ${eventName} is confirmed.</p>
      <p>Present this QR code at check-in.</p>
      <img src="cid:qr-code" alt="QR code" width="320" height="320" style="display: block; margin: 16px 0;" />
      <p style="font-size: 12px; color: #6b5a4a;">Keep this email for entry.</p>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    html,
    attachments: [
      {
        filename: "qr-code.png",
        content: qrBase64,
        content_type: "image/png",
        content_id: "qr-code",
      },
    ],
  });
}
