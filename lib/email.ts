let resend: any = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY manquante → email désactivé");
    return null;
  }

  if (!resend) {
    const { Resend } = require("resend");
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

export async function sendEmail(to: string, subject: string, text: string) {
  try {
    const client = getResend();

    if (!client) return; // pas de clé → on ignore

    await client.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to,
      subject,
      text,
    });

  } catch (err) {
    console.error("EMAIL ERROR:", err);
  }
}