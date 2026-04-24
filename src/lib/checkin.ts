import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken() {
  return randomBytes(32).toString("hex");
}

export function getCheckinExpiresAt() {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date.toISOString();
}

export async function createCheckinTokenForUser(userId: string, email: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("checkin_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: getCheckinExpiresAt(),
    sent_to_email: email,
  });

  if (error) {
    throw new Error(`Failed to create check-in token: ${error.message}`);
  }

  return token;
}

export async function sendCheckinEmail({
  to,
  checkinLink,
}: {
  to: string;
  checkinLink: string;
}) {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPortValue = process.env.SMTP_PORT?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "").trim();
  const fromEmail = process.env.CHECKIN_FROM_EMAIL?.trim();
  const smtpPort = smtpPortValue ? Number(smtpPortValue) : Number.NaN;

  if (!smtpHost || !smtpPortValue || !smtpUser || !smtpPass || !fromEmail) {
    console.log("Check-in link:", checkinLink, "to:", to);
    return;
  }

  if (!Number.isFinite(smtpPort)) {
    throw new Error("SMTP_PORT must be a valid number");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: fromEmail,
    to,
    subject: "Your daily BetterEveryday check-in",
    html: `<p>Hi there,</p><p>Your daily reflection link is ready.</p><p><a href=\"${checkinLink}\">Open today's check-in</a></p><p>This link expires in 24 hours.</p>`,
  });
}
