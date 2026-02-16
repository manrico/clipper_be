import nodemailer from 'nodemailer'

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`

  const transport = getTransport()
  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@clipper.com',
    to: email,
    subject: 'Verify your Clipper account',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>Welcome to Clipper, ${name}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a
          href="${verifyUrl}"
          style="display: inline-block; padding: 12px 24px; background: #6175f5; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;"
        >
          Verify Email
        </a>
        <p style="color: #666; font-size: 14px;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}
