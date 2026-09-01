// ─── Supabase Edge Function: new-user-notification ───────────────────────────
// Wird per Datenbank-Trigger auf auth.users (AFTER INSERT) aufgerufen — siehe
// supabase/migrations/010_new_user_notification.sql. Verschickt eine kurze
// Benachrichtigungs-Mail an die Founder, sobald sich ein neuer User registriert.
//
// Aufruf ausschließlich serverseitig (Trigger → pg_net, mit Service-Role-Key
// als Bearer-Token, gleiches Muster wie trial-reminder-emails).
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

// Wer benachrichtigt werden soll — bewusst hier dupliziert statt aus dem
// Frontend importiert (Edge Functions laufen in Deno, getrennt vom Vite-Build).
// Bei Änderung auch src/config/payments.js (FOUNDER_EMAILS) mit aktualisieren.
const NOTIFY_EMAILS = [
  'maxkammel21@gmail.com',
  'kammelmax@icloud.com',
  'david@davidschmidbauer.com',
];

serve(async (req) => {
  try {
    const { email, user_id, created_at } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Keine E-Mail übergeben' }), { status: 400 });
    }

    const ok = await sendNotification(email, user_id, created_at);
    return new Response(JSON.stringify({ sent: ok }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('new-user-notification Fehler:', err);
    // Absichtlich 200 statt 500: Der aufrufende Trigger fängt Fehler zwar
    // ohnehin ab, aber ein "sauberer" Response hält Retry-Logik von pg_net ruhig.
    return new Response(JSON.stringify({ error: String(err) }), { status: 200 });
  }
});

async function sendNotification(email: string, userId: string | undefined, createdAt: string | undefined): Promise<boolean> {
  const host = Deno.env.get('SMTP_HOST');
  const port = Number(Deno.env.get('SMTP_PORT') ?? '587');
  const user = Deno.env.get('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASS');
  const from = Deno.env.get('SMTP_FROM') ?? user;

  if (!host || !user || !pass) {
    console.error('SMTP nicht konfiguriert — SMTP_HOST/SMTP_USER/SMTP_PASS fehlen als Secrets.');
    return false;
  }

  const zeitpunkt = createdAt
    ? new Date(createdAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <p style="font-size: 15px; line-height: 1.6;">Neue Registrierung bei renditly 🎉</p>
      <table style="font-size: 14px; line-height: 1.8; margin: 16px 0;">
        <tr><td style="color: #64748b; padding-right: 12px;">E-Mail:</td><td><strong>${email}</strong></td></tr>
        <tr><td style="color: #64748b; padding-right: 12px;">Zeitpunkt:</td><td>${zeitpunkt}</td></tr>
        ${userId ? `<tr><td style="color: #64748b; padding-right: 12px;">User-ID:</td><td style="font-family: monospace; font-size: 12px;">${userId}</td></tr>` : ''}
      </table>
    </div>
  `;

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username: user, password: pass },
    },
  });

  let allOk = true;
  for (const to of NOTIFY_EMAILS) {
    try {
      await client.send({
        from: from!,
        to,
        subject: `Neuer renditly-User: ${email}`,
        content: 'text/html',
        html,
      });
    } catch (err) {
      console.error(`SMTP-Fehler beim Senden an ${to}:`, err);
      allOk = false;
    }
  }
  try { await client.close(); } catch { /* ignorieren */ }
  return allOk;
}
