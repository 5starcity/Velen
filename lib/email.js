import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,           // e.g. mail.rezidence.ng or Whogohost's provided host
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,          // hello@rezidence.ng
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const mailer = getTransporter();

  return mailer.sendMail({
    from: `"Rezidence" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  });
}