import { useState } from 'react';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import { berechneMieteranteil } from './NKAbrechnungFormular';

const NKAbrechnungDetail = ({ abrechnung, onEdit, onDelete, onClose }) => {
  const mf = Number(abrechnung.mieterflaeche) || 0;
  const gf = Number(abrechnung.gesamtflaeche) || 0;
  const ap = Number(abrechnung.anzahl_parteien) || 1;
  const positionen = abrechnung.kostenpositionen || [];

  const gesamtMieteranteil = positionen.reduce((sum, pos) =>
    sum + berechneMieteranteil(pos, mf, gf, ap), 0);
  const vorauszahlungen = Number(abrechnung.vorauszahlungen_gesamt) || 0;
  const ergebnis = gesamtMieteranteil - vorauszahlungen;

  const statusBadge = { entwurf: '📝 Entwurf', versendet: '📬 Versendet', abgeschlossen: '✅ Abgeschlossen' };
  const statusColor = { entwurf: 'bg-yellow-100 text-yellow-700', versendet: 'bg-blue-100 text-blue-700', abgeschlossen: 'bg-green-100 text-green-700' };

  const exportPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Header
    pdf.setFontSize(18);
    pdf.setTextColor(0, 100, 80);
    pdf.text('Nebenkostenabrechnung', 105, 20, { align: 'center' });
    pdf.setFontSize(14);
    pdf.setTextColor(50, 50, 50);
    pdf.text(`Abrechnungsjahr ${abrechnung.abrechnungsjahr}`, 105, 28, { align: 'center' });

    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 14, 38);

    // Mieterdaten
    pdf.setFontSize(11);
    pdf.setTextColor(30, 30, 30);
    pdf.text('Mieter:', 14, 50);
    pdf.setFontSize(10);
    pdf.text(abrechnung.mieter_name || '—', 14, 57);
    if (abrechnung.immobilie_name) {
      pdf.setTextColor(100, 100, 100);
      pdf.text(abrechnung.immobilie_name, 14, 63);
    }

    // Flächen
    pdf.autoTable({
      startY: 70,
      head: [['Angabe', 'Wert']],
      body: [
        ['Mieterfläche', `${mf} m²`],
        ['Gesamtfläche', `${gf} m²`],
        ['Mieteranteil', gf > 0 ? `${((mf / gf) * 100).toFixed(1)} %` : '—'],
        ['Anzahl Parteien', `${ap}`],
        ['Abrechnungszeitraum', `01.01.${abrechnung.abrechnungsjahr} – 31.12.${abrechnung.abrechnungsjahr}`],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 128, 100] },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 14, right: 14 }
    });

    // Kostenpositionen
    const posRows = positionen.map(pos => {
      const anteil = berechneMieteranteil(pos, mf, gf, ap);
      const schluessel = { wohnflaeche: 'Wohnfläche', kopf: 'Pro Partei', fest: 'Fest' }[pos.umlageschluessel] || pos.umlageschluessel;
      return [
        pos.bezeichnung,
        `${(Number(pos.gesamtkosten) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`,
        schluessel,
        `${anteil.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`,
      ];
    });

    const lastY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : 130;
    pdf.setFontSize(11);
    pdf.setTextColor(30, 30, 30);
    pdf.text('Kostenaufstellung', 14, lastY);

    pdf.autoTable({
      startY: lastY + 5,
      head: [['Position', 'Gesamtkosten', 'Schlüssel', 'Ihr Anteil']],
      body: posRows,
      foot: [['Gesamt Ihr Anteil', '', '', `${gesamtMieteranteil.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 128, 100] },
      footStyles: { fillColor: [220, 240, 235], textColor: [0, 80, 60], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 }
    });

    // Ergebnis
    const resY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : 200;
    pdf.autoTable({
      startY: resY,
      body: [
        ['Summe NK-Kosten Ihr Anteil', `${gesamtMieteranteil.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`],
        ['./. geleistete Vorauszahlungen', `${vorauszahlungen.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`],
        [ergebnis >= 0 ? '= Nachzahlung' : '= Guthaben', `${Math.abs(ergebnis).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`],
      ],
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.index === 2) {
          data.cell.styles.fillColor = ergebnis >= 0 ? [255, 220, 220] : [220, 255, 220];
          data.cell.styles.textColor = ergebnis >= 0 ? [160, 0, 0] : [0, 120, 0];
        }
      },
      margin: { left: 14, right: 14 }
    });

    if (abrechnung.notizen) {
      const notizY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : 240;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Notizen: ${abrechnung.notizen}`, 14, notizY);
    }

    pdf.save(`NK-Abrechnung_${abrechnung.mieter_name}_${abrechnung.abrechnungsjahr}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-teal-700 text-white p-5 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">📄 NK-Abrechnung {abrechnung.abrechnungsjahr}</h2>
            <p className="text-teal-200 text-sm">{abrechnung.mieter_name} · {abrechnung.immobilie_name}</p>
          </div>
          <button onClick={onClose} className="text-white text-2xl hover:text-teal-200">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor[abrechnung.status] || 'bg-gray-100 text-gray-600'}`}>
              {statusBadge[abrechnung.status] || abrechnung.status}
            </span>
            <span className="text-xs text-gray-400">Erstellt: {new Date(abrechnung.created_at).toLocaleDateString('de-DE')}</span>
          </div>

          {/* Flächeninfo */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm grid grid-cols-3 gap-2">
            <div><div className="text-xs text-gray-500">Mieterfläche</div><div className="font-semibold">{mf} m²</div></div>
            <div><div className="text-xs text-gray-500">Gesamtfläche</div><div className="font-semibold">{gf} m²</div></div>
            <div><div className="text-xs text-gray-500">Anteil</div><div className="font-semibold text-teal-700">{gf > 0 ? ((mf/gf)*100).toFixed(1) : '—'} %</div></div>
          </div>

          {/* Positionen */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Kostenaufstellung</p>
            <div className="space-y-1">
              {positionen.map((pos, idx) => {
                const anteil = berechneMieteranteil(pos, mf, gf, ap);
                return (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span className="text-gray-700">{pos.bezeichnung}</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-800">
                        {anteil.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        (von {(Number(pos.gesamtkosten)||0).toLocaleString('de-DE', {minimumFractionDigits:2})} €)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ergebnis */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">NK-Kosten gesamt (Ihr Anteil)</span>
              <span className="font-semibold">{gesamtMieteranteil.toLocaleString('de-DE', {minimumFractionDigits:2})} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">./. Vorauszahlungen</span>
              <span className="font-semibold">− {vorauszahlungen.toLocaleString('de-DE', {minimumFractionDigits:2})} €</span>
            </div>
            <div className={`flex justify-between font-bold pt-2 border-t border-gray-200 ${ergebnis > 0 ? 'text-red-700' : ergebnis < 0 ? 'text-green-700' : 'text-gray-700'}`}>
              <span>{ergebnis > 0 ? '💸 Nachzahlung Mieter' : ergebnis < 0 ? '💚 Guthaben Mieter' : 'Ergebnis'}</span>
              <span>{Math.abs(ergebnis).toLocaleString('de-DE', {minimumFractionDigits:2})} €</span>
            </div>
          </div>

          {abrechnung.notizen && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">📝 {abrechnung.notizen}</div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button onClick={exportPDF}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold text-sm">
              📥 PDF herunterladen
            </button>
            <button onClick={onEdit}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
              ✏️ Bearbeiten
            </button>
            <button onClick={onDelete}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NKAbrechnungDetail;
