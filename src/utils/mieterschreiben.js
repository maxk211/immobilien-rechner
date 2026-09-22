import { getJsPDF } from './lazyLibs.js';

// Abschnitt 3.8 / 6d: Mieterschreiben zu einer NK-Abrechnung (Shape A —
// params.nkAbrechnungen einer Kaufimmobilie) als PDF-Brief erzeugen.
// Angelehnt an das bestehende exportPDF() in NKAbrechnungDetail.jsx (Shape B),
// aber auf die Felder von Shape A umgestellt (abrechnungsjahr, mieterName,
// wohnflaeche, gesamtflaeche, vorauszahlungen, kostenpositionen[], notizen).
export async function erstelleMieterschreiben(abrechnung, immobilie) {
  const jsPDF = await getJsPDF();
  const pdf = new jsPDF('p', 'mm', 'a4');

  const positionen = abrechnung.kostenpositionen || [];
  const gesamtkosten = positionen.reduce((s, k) => s + ((k.gesamtkosten || 0) * ((k.mieteranteil ?? 100) / 100)), 0);
  const vorauszahlungen = Number(abrechnung.vorauszahlungen) || 0;
  const ergebnis = gesamtkosten - vorauszahlungen; // > 0 = Nachzahlung, < 0 = Erstattung
  const objektName = immobilie?.name || immobilie?.adresse || '—';
  const jahr = abrechnung.abrechnungsjahr;

  // Header
  pdf.setFontSize(18);
  pdf.setTextColor(30, 41, 59);
  pdf.text('Nebenkostenabrechnung', 105, 20, { align: 'center' });
  pdf.setFontSize(12);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`Abrechnungszeitraum: 01.01.${jahr} – 31.12.${jahr}`, 105, 28, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 14, 38);

  // Objekt & Mieter
  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);
  pdf.text('Objekt:', 14, 50);
  pdf.setFontSize(10);
  pdf.text(objektName, 40, 50);

  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);
  pdf.text('Mieter:', 14, 57);
  pdf.setFontSize(10);
  pdf.text(abrechnung.mieterName || '—', 40, 57);

  if (abrechnung.wohnflaeche && abrechnung.gesamtflaeche) {
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Wohnfläche: ${abrechnung.wohnflaeche} m² von ${abrechnung.gesamtflaeche} m² Gesamtfläche`,
      14, 64
    );
  }

  // Kostenpositionen
  const posRows = positionen.filter(k => k.gesamtkosten > 0).map(pos => [
    pos.label || pos.key,
    `${(Number(pos.gesamtkosten) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`,
    `${pos.mieteranteil ?? 100} %`,
    `${((pos.gesamtkosten || 0) * ((pos.mieteranteil ?? 100) / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`,
  ]);

  pdf.autoTable({
    startY: 72,
    head: [['Position', 'Gesamtkosten', 'Ihr Anteil', 'Betrag']],
    body: posRows,
    foot: [['Summe', '', '', `${gesamtkosten.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] },
    footStyles: { fillColor: [224, 231, 255], textColor: [55, 48, 163], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // Ergebnis
  const resY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : 150;
  pdf.autoTable({
    startY: resY,
    body: [
      ['Summe Nebenkosten (Ihr Anteil)', `${gesamtkosten.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`],
      ['./. geleistete Vorauszahlungen', `${vorauszahlungen.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`],
      [ergebnis >= 0 ? '= Nachzahlung' : '= Erstattung', `${Math.abs(ergebnis).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`],
    ],
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = ergebnis >= 0 ? [254, 226, 226] : [220, 252, 231];
        data.cell.styles.textColor = ergebnis >= 0 ? [153, 27, 27] : [22, 101, 52];
      }
    },
    margin: { left: 14, right: 14 },
  });

  if (abrechnung.notizen) {
    const notizY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : 220;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Notizen: ${abrechnung.notizen}`, 14, notizY);
  }

  pdf.save(`Mieterschreiben_NK-Abrechnung_${(abrechnung.mieterName || 'Mieter').replace(/\s+/g, '_')}_${jahr}.pdf`);
}
