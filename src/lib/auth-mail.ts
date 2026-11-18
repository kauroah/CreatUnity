import nodemailer from 'nodemailer';

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to send authentication emails.`);
  return value;
}

export async function sendAuthEmail(to: string, subject: string, link: string, action: string) {
  const port = Number(process.env.SMTP_PORT || '587');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT must be a valid port.');
  const transport = nodemailer.createTransport({
    host: required('SMTP_HOST'),
    port,
    secure: port === 465,
    auth: { user: required('SMTP_USER'), pass: required('SMTP_PASSWORD') },
  });
  await transport.sendMail({
    from: required('SMTP_FROM'),
    to,
    subject,
    text: `${action}\n\n${link}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>${action}</p><p><a href="${link}">${link}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}
