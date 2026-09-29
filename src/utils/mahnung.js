// Freundliche Zahlungserinnerung als PDF (Cockpit → "Jetzt dran" → "Mahnen").
// Absender kommt aus derselben gespeicherten Vermieter-Adresse wie beim
// Mieterhöhungsschreiben; fehlt sie, bleibt eine Platzhalterzeile zum Ausfüllen.
import { getJsPDF } from './lazyLibs.js';
import { formatCurrency } from './format.js';

const LS_VERMIETER_ADRESSE_KEY = 'renditly-vermieter-adresse';

const ladeVermieter = () => {
  try {
    const raw = localStorage.getItem(LS_VERMIETER_ADRESSE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export async function erstelleZahlungserinnerung({ mieterName, objektAdresse, monatLabel, betrag, faelligAm, zahlungsfristTage = 7 }) {
  const jsPDF = await getJsPDF();
  const pdf = new jsPDF('p', 'mm', 'a4');
  const m = 20;
  const v = ladeVermieter() || {};
  const heute = new Date();
  const frist = new Date(heute.getTime() + zahlungsfristTage * 86400000);
  const d = (x) => x.toLocaleDateString('de-DE');

  pdf.setFontSize(9);
  pdf.setTextColor(110);
  pdf.text([v.vermieterName, v.vermieterStrasse, v.vermieterPlzOrt].filter(Boolean).join(' · ') || '[Dein Name · Straße · PLZ Ort]', m, 20);

  pdf.setTextColor(0);
  pdf.setFontSize(11);
  pdf.text([mieterName || '[Name Mieter]', objektAdresse || '[Anschrift]'], m, 40);
  pdf.text(`${v.vermieterPlzOrt ? v.vermieterPlzOrt.replace(/^\d{5}\s*/, '') + ', ' : ''}${d(heute)}`, 190, 60, { align: 'right' });

  pdf.setFont(undefined, 'bold');
  pdf.text(`Zahlungserinnerung – Miete ${monatLabel}`, m, 75);
  pdf.setFont(undefined, 'normal');

  const text = [
    `Sehr geehrte/r ${mieterName || 'Mieterin/Mieter'},`,
    '',
    `bei der Durchsicht meiner Unterlagen habe ich festgestellt, dass die Miete für ${monatLabel}`,
    `in Höhe von ${formatCurrency(betrag)}${faelligAm ? `, fällig am ${d(faelligAm)},` : ''} bisher nicht bei mir eingegangen ist.`,
    '',
    'Sicher handelt es sich um ein Versehen. Bitte überweisen Sie den offenen Betrag',
    `bis zum ${d(frist)} auf das bekannte Konto.`,
    '',
    'Sollten Sie die Zahlung inzwischen veranlasst haben, betrachten Sie dieses Schreiben',
    'bitte als gegenstandslos.',
    '',
    'Mit freundlichen Grüßen',
    '',
    '',
    v.vermieterName || '[Dein Name]',
  ];
  pdf.text(text, m, 90);

  const safe = (s) => String(s || '').replace(/[^\wäöüÄÖÜß-]+/g, '_');
  pdf.save(`Zahlungserinnerung_${safe(mieterName)}_${safe(monatLabel)}.pdf`);
}
