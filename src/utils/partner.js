// Partner-Programm: Datenzugriff (Supabase) + Merken der Makler-Wahl im Browser.
// Die Landingpage merkt sich die Wahl, damit sie auch greift, wenn jemand sich
// erst später in der App registriert oder schon ein Konto hatte.
import { supabase } from '../supabaseClient';

const KEY = 'renditly_partner';
const GUELTIG_TAGE = 60;

export function partnerMerken(wahl) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...wahl, zeit: Date.now() })); } catch { /* privat-Modus */ }
}

export function partnerGemerkt() {
  try {
    const w = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!w || Date.now() - (w.zeit || 0) > GUELTIG_TAGE * 864e5) return null;
    return w;
  } catch { return null; }
}

export function partnerVergessen() {
  try { localStorage.removeItem(KEY); } catch { /* egal */ }
}

// user_metadata für signUp() — der Datenbank-Trigger legt daraus die Zuordnung an
export function partnerMetadaten(wahl = partnerGemerkt()) {
  if (!wahl) return {};
  return {
    ...(wahl.id ? { partner_makler_id: wahl.id } : {}),
    ...(wahl.freitext ? { partner_freitext: String(wahl.freitext).slice(0, 120) } : {}),
  };
}

// Öffentliche Suche — nur aufgenommene Makler, max. 8 Treffer
export async function maklerSuchen(q) {
  const { data, error } = await supabase.rpc('partner_makler_suche', { q: q || '' });
  if (error) throw error;
  return data || [];
}

export async function maklerPerCode(code) {
  if (!code) return null;
  const { data, error } = await supabase.rpc('partner_makler_per_code', { c: code });
  if (error) return null;
  return data?.[0] || null;
}

// Für eingeloggte Nutzer (App-Start): gemerkte Wahl einmalig zuordnen
export async function partnerZuordnungAbschliessen() {
  const w = partnerGemerkt();
  if (!w || (!w.id && !w.freitext)) return false;
  const { error } = await supabase.rpc('partner_zuordnen', { p_makler_id: w.id || null, p_freitext: w.freitext || null });
  if (!error) partnerVergessen();
  return !error;
}

// Anzeige: "Anna Berger · Berger Immobilien"
export const maklerTitel = (m) => m ? [m.name, m.firma].filter(Boolean).join(' · ') : '';
export const initialen = (s = '') => s.split(/\s+/).filter(w => /^[\p{L}\d]/u.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

// Treffer-Hervorhebung: Teile mit {text, treffer}
export function markiere(text = '', q = '') {
  const t = q.trim().toLowerCase();
  if (!t || !text) return [{ text, treffer: false }];
  const teile = [];
  const re = new RegExp(`(^|\\s)(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
  const m = text.match(re);
  if (!m) return [{ text, treffer: false }];
  const start = m.index + m[1].length;
  if (start > 0) teile.push({ text: text.slice(0, start), treffer: false });
  teile.push({ text: text.slice(start, start + t.length), treffer: true });
  if (start + t.length < text.length) teile.push({ text: text.slice(start + t.length), treffer: false });
  return teile;
}
