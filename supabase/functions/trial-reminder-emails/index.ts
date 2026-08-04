// ─── Supabase Edge Function: trial-reminder-emails ───────────────────────────
// Läuft täglich per pg_cron (siehe supabase/migrations/008_trial_reminder_tracking.sql)
// und verschickt Erinnerungs-Mails an Trial-User, deren Test in 10, 3 oder 1
// Tagen abläuft. Vorher gab es KEINE automatisierte Erinnerung — Nutzer haben
// den 90-Tage-Trial schlicht vergessen, bevor sie zahlen konnten.
//
// Aufruf ausschließlich serverseitig (pg_cron → pg_net, mit Service-Role-Key
// als Bearer-Token). Kein --no-verify-jwt nötig, Supabase prüft den Service-
// Role-JWT automatisch am Gateway.
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const TRIAL_DAYS = 90;
// Schwellen in "Tage bis Trial-Ende" — je Schwelle genau eine Mail, nie mehrfach.
const THRESHOLDS = [10, 3, 1];

serve(async (req) => {
  try {
    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, trial_started_at, trial_reminders_sent, status, plan, stripe_subscription_id')
      .or('status.eq.trial,plan.eq.trial');

    if (error) {
      console.error('Subscriptions-Abruf Fehler:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const now = Date.now();
    let sent = 0;
    let skipped = 0;

    for (const sub of subs ?? []) {
      // Nur echte, noch nicht bezahlte Trials (keine bereits konvertierten Abos)
      if (sub.stripe_subscription_id) { skipped++; continue; }
      if (!sub.trial_started_at) { skipped++; continue; }

      const trialStart = new Date(sub.trial_started_at).getTime();
      const daysElapsed = (now - trialStart) / (1000 * 60 * 60 * 24);
      const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysElapsed));

      if (daysLeft <= 0) { skipped++; continue; } // abgelaufen — kein "läuft bald ab" mehr

      const alreadySent: number[] = Array.isArray(sub.trial_reminders_sent) ? sub.trial_reminders_sent : [];
      const applicable = THRESHOLDS.filter((t) => daysLeft <= t && !alreadySent.includes(t));
      if (applicable.length === 0) { skipped++; continue; }

      const threshold = Math.min(...applicable); // aktuellste/dringendste fällige Schwelle

      const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(sub.user_id);
      if (userErr || !userData?.user?.email) {
        console.error(`Kein E-Mail für user_id ${sub.user_id}:`, userErr);
        skipped++;
        continue;
      }

      const ok = await sendTrialReminder(userData.user.email, daysLeft);
      if (!ok) { skipped++; continue; }

      // Alle Schwellen >= threshold als erledigt markieren, damit bei einem
      // ausgefallenen Cron-Lauf nicht mehrere veraltete Mails nachgeholt werden.
      const newSent = Array.from(new Set([...alreadySent, ...THRESHOLDS.filter((t) => t >= threshold)]));
      await supabase.from('subscriptions').update({ trial_reminders_sent: newSent }).eq('id', sub.id);
      sent++;
    }

    console.log(`trial-reminder-emails: ${sent} gesendet, ${skipped} übersprungen`);
    return new Response(JSON.stringify({ sent, skipped }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('trial-reminder-emails Fehler:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

// ─── E-Mail versenden ─────────────────────────────────────────────────────────
async function sendTrialReminder(email: string, daysLeft: number): Promise<boolean> {
  const host = Deno.env.get('SMTP_HOST');
  const port = Number(Deno.env.get('SMTP_PORT') ?? '587');
  const user = Deno.env.get('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASS');
  const from = Deno.env.get('SMTP_FROM') ?? user;

  if (!host || !user || !pass) {
    console.error('SMTP nicht konfiguriert — SMTP_HOST/SMTP_USER/SMTP_PASS fehlen als Secrets.');
    return false;
  }

  const betreff = daysLeft === 1
    ? 'Dein renditly-Trial läuft morgen ab'
    : `Noch ${daysLeft} Tage in deinem renditly-Trial`;

  const einleitung = daysLeft === 1
    ? 'dein kostenloser Test bei renditly läuft <strong>morgen</strong> ab.'
    : `dein kostenloser Test bei renditly läuft in <strong>${daysLeft} Tagen</strong> ab.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <p style="font-size: 15px; line-height: 1.6;">Hallo,</p>
      <p style="font-size: 15px; line-height: 1.6;">${einleitung}</p>
      <p style="font-size: 15px; line-height: 1.6;">Damit dein Portfolio, deine Mieter- und Steuerdaten ohne Unterbrechung erhalten bleiben, wähle jetzt einen Plan:</p>
      <a href="https://www.renditly.de/app" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #6366f1; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 12px; font-size: 14px;">
        Jetzt Plan wählen →
      </a>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b;">Fragen? Antworte einfach auf diese E-Mail — wir helfen gern persönlich weiter.</p>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-top: 24px;">Viele Grüße<br/>Dein renditly-Team</p>
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

  try {
    await client.send({
      from: from!,
      to: email,
      subject: betreff,
      content: 'text/html',
      html,
    });
    await client.close();
    console.log(`Trial-Reminder (${daysLeft} Tage) gesendet an: ${email}`);
    return true;
  } catch (err) {
    console.error(`SMTP-Fehler beim Senden an ${email}:`, err);
    try { await client.close(); } catch { /* ignorieren */ }
    return false;
  }
}
