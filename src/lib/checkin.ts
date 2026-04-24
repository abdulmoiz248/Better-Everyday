import { createHash, randomBytes } from "node:crypto";
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
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CHECKIN_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    console.log("Check-in link:", checkinLink, "to:", to);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: "Your daily BetterEveryday check-in",
      html: `<p>Hi there,</p><p>Your daily reflection link is ready.</p><p><a href=\"${checkinLink}\">Open today\'s check-in</a></p><p>This link expires in 24 hours.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send check-in email: ${response.status} ${body}`);
  }
}
