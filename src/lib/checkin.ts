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
  currentStreak,
  lastReflection,
}: {
  to: string;
  checkinLink: string;
  currentStreak?: number;
  lastReflection?: {
    learned_today: string;
    created_at: string;
  } | null;
}) {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPortValue = process.env.SMTP_PORT?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "").trim();
  const fromEmail = process.env.CHECKIN_FROM_EMAIL?.trim();
  const smtpPort = smtpPortValue ? Number(smtpPortValue) : Number.NaN;

  if (!smtpHost || !smtpPortValue || !smtpUser || !smtpPass || !fromEmail) {
    console.log("Check-in link:", checkinLink, "to:", to);
    console.log("Streak:", currentStreak, "Last reflection:", lastReflection?.learned_today);
    return;
  }

  if (!Number.isFinite(smtpPort)) {
    throw new Error("SMTP_PORT must be a valid number");
  }

  const streakBadge =
    currentStreak && currentStreak > 0
      ? `<p style="font-size: 18px; color: #f59e0b;">🔥 Current Streak: <strong>${currentStreak} days</strong></p>`
      : "";

  const yesterdayNote =
    lastReflection && lastReflection.learned_today
      ? `<p style="color: #6b7280; margin-top: 12px;"><em>Yesterday you noted: "${lastReflection.learned_today.substring(0, 100)}${lastReflection.learned_today.length > 100 ? "..." : ""}"</em></p>`
      : "";

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
    subject: `Daily check-in${currentStreak && currentStreak > 0 ? ` 🔥 (Day ${currentStreak})` : ""}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1f2937;">BetterEveryday Check-in</h1>
        ${streakBadge}
        <p>Today is another day to get 1% better. The difference between 1.01^365 and 0.99^365 is everything.</p>
        ${yesterdayNote}
        <div style="margin: 24px 0;">
          <a href="${checkinLink}" style="
            display: inline-block;
            background-color: #1f2937;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          ">Open today's check-in</a>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

