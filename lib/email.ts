export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_HOST) {
    console.log("SMTP non configuré");
    return;
  }

  const nodemailer = await import("nodemailer");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
  });
}