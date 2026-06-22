import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    // eslint-disable-next-line no-console
    console.log(`[email:disabled] would send "${subject}" to ${to}`);
    return false;
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Email send failed:', err);
    return false;
  }
}
