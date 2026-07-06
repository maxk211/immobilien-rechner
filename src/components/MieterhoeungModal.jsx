import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { formatCurrency } from '../utils/format.js';

/**
 * MieterhoeungModal
 *
 * Props:
 *   mieter       — Mieterobjekt { name, kaltmiete, adresse, ... }
 *   immobilie    — Immobilieobjekt { name, adresse, plz, ... }
 *   onClose      — Schließen
 *   onSave(mieterUpdate, immoUpdate)  — Speichern
 *
 * mieterUpdate : { letzte_mieterhoehung: 'YYYY-MM-DD', kaltmiete: Zahl }
 * immoUpdate   : { mietAnpassungen: [...] }
 */
const MieterhoeungModal = ({ mieter, immobilie, onClose, onSave }) => {
  const heute = new Date();
  const heutStr = heute.toISOString().slice(0, 10);

  const aktKaltmiete = parseFloat(mieter?.kaltmiete) || 0;

  // Wirksamkeitsdatum berechnen: frühestens Beginn des 3. Kalendermonats nach Zugang (§ 558b BGB)
  const frühestesWirksamkeitsDatum = useMemo(() => {
    const d = new Date(heute);
    d.setMonth(d.getMonth() + 3);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  }, []);

  // Zustimmungsfrist: Ende des 2. Kalendermonats nach Zugang (§ 558b BGB)
  const zustimmungsFrist = useMemo(() => {
    const d = new Date(heute);
    d.setMonth(d.getMonth() + 3);
    d.setDate(0); // letzter Tag des 2. Monats nach Zugang
    return d.toISOString().slice(0, 10);
  }, []);

  const [form, setForm] = useState({
    neueKaltmiete: aktKaltmiete > 0 ? Math.ceil(aktKaltmiete * 1.05) : '',
    wirksamkeitsDatum: frühestesWirksamkeitsDatum,
    begründungsTyp: 'mietspiegel',
    mietspiegelJahr: new Date().getFullYear().toString(),
    mietspiegelQuelle: 'Mietspiegel der Gemeinde',
    eigenerText: '',
    vermieterName: '',
    vermieterStrasse: '',
    vermieterPlzOrt: '',
  });

  const neueKalt = parseFloat(form.neueKaltmiete) || 0;
  const diff = neueKalt - aktKaltmiete;
  const diffProzent = aktKaltmiete > 0 ? ((diff / aktKaltmiete) * 100).toFixed(1) : '—';

  const begründungsOptionen = [
    { value: 'mietspiegel', label: '📊 Ortsüblicher Mietspiegel (§ 558 BGB)', desc: 'Die Miete liegt unterhalb der ortsüblichen Vergleichsmiete laut Mietspiegel.' },
    { value: 'vergleichswohnungen', label: '🏠 Vergleichswohnungen (§ 558 BGB)', desc: 'Die Miete entspricht der üblichen Miete für vergleichbare Wohnungen in der Umgebung.' },
    { value: 'sachverstaendiger', label: '🔍 Sachverständigengutachten (§ 558 BGB)', desc: 'Gemäß Gutachten eines öffentlich bestellten Sachverständigen.' },
  ];

  const wirksamDatum = new Date(form.wirksamkeitsDatum);
  const wirksamStr = wirksamDatum.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── PDF generieren ────────────────────────────────────────────────────────────
  const generatePDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const margin = 20;
    let y = 20;

    const GRAY = [100, 100, 100];
    const DARK = [20, 30, 50];

    const writeLine = (text, x, yPos, size = 10, style = 'normal', color = DARK) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', style);
      pdf.setTextColor(...color);
      pdf.text(text, x, yPos);
    };

    // ── Absender (Vermieter) oben rechts ──
    const vName = form.vermieterName || 'Vermieter';
    const vStr = form.vermieterStrasse || '';
    const vPlz = form.vermieterPlzOrt || '';
    const vLines = [vName, vStr, vPlz].filter(Boolean);
    vLines.forEach((line, i) => {
      writeLine(line, pageW - margin - pdf.getTextWidth(line), y + i * 5, 10, i === 0 ? 'bold' : 'normal');
    });
    y += vLines.length * 5 + 8;

    // ── Datum rechts ──
    const datumStr = `${immobilie?.adresse?.split(',')[0]?.split(' ')[0] || ''}, den ${heute.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    writeLine(datumStr, pageW - margin - pdf.getTextWidth(datumStr), y, 10, 'normal', GRAY);
    y += 12;

    // ── Empfänger (Mieter) ──
    writeLine('An:', margin, y, 9, 'normal', GRAY);
    y += 5;
    writeLine(mieter?.name || 'Mieter', margin, y, 10, 'bold');
    y += 5;
    const immoAdresse = immobilie?.adresse || '';
    if (immoAdresse) { writeLine(immoAdresse, margin, y, 10); y += 5; }
    if (immobilie?.plz) { writeLine(immobilie.plz, margin, y, 10); y += 5; }
    y += 10;

    // ── Betreff ──
    const betreffAdresse = immoAdresse || immobilie?.name || 'das o.g. Mietverhältnis';
    writeLine(`Mieterhöhung gemäß § 558 BGB — ${betreffAdresse}`, margin, y, 12, 'bold', DARK);
    y += 10;

    // ── Anrede ──
    writeLine(`Sehr geehrte/r ${mieter?.name || 'Mieterin/Mieter'},`, margin, y, 10);
    y += 8;

    // ── Haupttext ──
    const haupttext = `hiermit beantrage ich gemäß § 558 BGB die Zustimmung zur Erhöhung der Grundmiete für die oben genannte Wohnung. Die bisherige Kaltmiete liegt unterhalb der ortsüblichen Vergleichsmiete und soll an diese angeglichen werden.`;
    const lines = pdf.splitTextToSize(haupttext, pageW - 2 * margin);
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...DARK);
    pdf.text(lines, margin, y);
    y += lines.length * 5 + 6;

    // ── Tabelle: Alte → Neue Miete ──
    pdf.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['', 'Betrag']],
      body: [
        ['Bisherige Kaltmiete', `${aktKaltmiete.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`],
        ['Neue Kaltmiete', `${neueKalt.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`],
        ['Erhöhung', `+${diff.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € (+${diffProzent} %)`],
      ],
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [230, 130, 30], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'normal', cellWidth: 100 }, 1: { fontStyle: 'bold', halign: 'right' } },
      alternateRowStyles: { fillColor: [252, 248, 240] },
    });
    y = pdf.lastAutoTable.finalY + 8;

    // ── Wirksamkeitsdatum ──
    writeLine(`Die neue Kaltmiete ist wirksam ab dem ${wirksamStr}.`, margin, y, 10, 'bold');
    y += 8;

    // ── Begründung ──
    writeLine('Begründung', margin, y, 10, 'bold');
    y += 6;
    let begText = '';
    if (form.begründungsTyp === 'mietspiegel') {
      begText = `Die ortsübliche Vergleichsmiete für vergleichbare Wohnungen beträgt gemäß ${form.mietspiegelQuelle} (${form.mietspiegelJahr}) mindestens ${neueKalt.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Monat. Die neue Kaltmiete entspricht dieser ortsüblichen Vergleichsmiete (§ 558 Abs. 2 BGB).`;
    } else if (form.begründungsTyp === 'vergleichswohnungen') {
      begText = `Auf dem örtlichen Wohnungsmarkt werden für vergleichbare Wohnungen Kaltmieten von mindestens ${neueKalt.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Monat erzielt. Die neue Kaltmiete entspricht der ortsüblichen Vergleichsmiete (§ 558 Abs. 2 BGB).`;
    } else {
      begText = `Gemäß Gutachten eines öffentlich bestellten Sachverständigen beträgt die ortsübliche Vergleichsmiete mindestens ${neueKalt.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Monat.`;
    }
    if (form.eigenerText) begText += ' ' + form.eigenerText;
    const begLines = pdf.splitTextToSize(begText, pageW - 2 * margin);
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...DARK);
    pdf.text(begLines, margin, y);
    y += begLines.length * 5 + 8;

    // ── Zustimmungsfrist ──
    const zustFristStr = new Date(zustimmungsFrist).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    const zustText = `Ich bitte Sie, der Mieterhöhung bis zum ${zustFristStr} zuzustimmen (§ 558b Abs. 2 BGB). Sollten Sie der Erhöhung nicht fristgerecht zustimmen, behalte ich mir vor, Klage auf Zustimmung zu erheben.`;
    const zustLines = pdf.splitTextToSize(zustText, pageW - 2 * margin);
    pdf.setFontSize(9.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...GRAY);
    pdf.text(zustLines, margin, y);
    y += zustLines.length * 4.5 + 12;

    // ── Grußformel + Unterschrift ──
    writeLine('Mit freundlichen Grüßen,', margin, y, 10, 'normal', DARK);
    y += 16;
    pdf.setDrawColor(80, 80, 80);
    pdf.line(margin, y, margin + 70, y);
    y += 5;
    writeLine(vName, margin, y, 10, 'bold', DARK);
    y += 5;
    writeLine('(Vermieter)', margin, y, 9, 'normal', GRAY);

    // ── Footer ──
    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...GRAY);
    pdf.text('Dieses Schreiben wurde mit dem Immobilien-Rechner erstellt. Kein Rechtsberatungsersatz.', margin, 285);

    const dateiName = `Mieterhöhung_${(mieter?.name || 'Mieter').replace(/\s+/g, '_')}_${form.wirksamkeitsDatum}.pdf`;
    pdf.save(dateiName);
  };

  // ── Speichern ─────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!neueKalt || neueKalt <= 0) { alert('Bitte eine gültige neue Kaltmiete eingeben.'); return; }
    if (!form.wirksamkeitsDatum) { alert('Bitte Wirksamkeitsdatum angeben.'); return; }

    const mieterUpdate = {
      letzte_mieterhoehung: form.wirksamkeitsDatum,
      kaltmiete: neueKalt,
    };
    const immoUpdate = {
      neueAnpassung: { datum: form.wirksamkeitsDatum, kaltmiete: neueKalt },
    };
    onSave(mieterUpdate, immoUpdate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-2xl sm:max-w-lg max-h-[95vh] flex flex-col">
        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">📈 Mieterhöhung</h2>
            <p className="text-xs text-gray-500 mt-0.5">{mieter?.name} · {immobilie?.name || immobilie?.adresse}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Aktuelle Miete + neue Miete */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">Mietänderung</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 mb-1">Aktuelle Kaltmiete</p>
                <p className="text-xl font-black text-gray-500 line-through">{formatCurrency(aktKaltmiete)}</p>
              </div>
              <span className="text-2xl text-gray-300">→</span>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 mb-1">Neue Kaltmiete</p>
                <input
                  type="number"
                  value={form.neueKaltmiete}
                  onChange={e => setForm({ ...form, neueKaltmiete: parseFloat(e.target.value) || '' })}
                  className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg text-xl font-black text-blue-700 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                  step={5}
                />
              </div>
            </div>
            {neueKalt > 0 && aktKaltmiete > 0 && (
              <div className={`mt-3 flex justify-between items-center text-sm font-semibold px-1 ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                <span>Differenz:</span>
                <span>{diff > 0 ? '+' : ''}{formatCurrency(diff)}/mo ({diffProzent} %)</span>
              </div>
            )}
            {diff / aktKaltmiete > 0.2 && aktKaltmiete > 0 && (
              <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                ⚠️ Achtung: Die Erhöhung überschreitet 20 % — dies kann die Kappungsgrenze nach § 558 BGB verletzen (innerhalb von 3 Jahren max. 20 % bzw. 15 % in Gebieten mit Wohnungsmangel).
              </p>
            )}
          </div>

          {/* Fristen */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Wirksamkeitsdatum <span className="text-gray-400 font-normal">(§ 558b BGB)</span></label>
              <input
                type="date"
                value={form.wirksamkeitsDatum}
                min={frühestesWirksamkeitsDatum}
                onChange={e => setForm({ ...form, wirksamkeitsDatum: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">Frühestens {new Date(frühestesWirksamkeitsDatum).toLocaleDateString('de-DE')}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Zustimmungsfrist Mieter</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700">
                {new Date(zustimmungsFrist).toLocaleDateString('de-DE')}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Ende des 2. Monats nach Zugang</p>
            </div>
          </div>

          {/* Begründung */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Begründung (§ 558a BGB)</label>
            <div className="space-y-2">
              {begründungsOptionen.map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.begründungsTyp === opt.value ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <input type="radio" name="begründung" value={opt.value}
                    checked={form.begründungsTyp === opt.value}
                    onChange={e => setForm({ ...form, begründungsTyp: e.target.value })}
                    className="mt-0.5 accent-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {form.begründungsTyp === 'mietspiegel' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mietspiegel-Jahr</label>
                  <input type="text" value={form.mietspiegelJahr}
                    onChange={e => setForm({ ...form, mietspiegelJahr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="z.B. 2025" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quelle</label>
                  <input type="text" value={form.mietspiegelQuelle}
                    onChange={e => setForm({ ...form, mietspiegelQuelle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Mietspiegel der Gemeinde" />
                </div>
              </div>
            )}

            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Ergänzung (optional)</label>
              <textarea value={form.eigenerText}
                onChange={e => setForm({ ...form, eigenerText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={2} placeholder="Zusätzliche Begründung oder Hinweise..." />
            </div>
          </div>

          {/* Vermieter-Infos fürs Schreiben */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Vermieter-Angaben (für das Schreiben)</p>
            <div className="space-y-2">
              <input type="text" value={form.vermieterName}
                onChange={e => setForm({ ...form, vermieterName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Vorname Nachname" />
              <input type="text" value={form.vermieterStrasse}
                onChange={e => setForm({ ...form, vermieterStrasse: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Straße Hausnummer" />
              <input type="text" value={form.vermieterPlzOrt}
                onChange={e => setForm({ ...form, vermieterPlzOrt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="12345 Musterstadt" />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
          <button
            onClick={generatePDF}
            disabled={!neueKalt || neueKalt <= 0}
            className="w-full py-3 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-gray-900 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            📄 Mieterhöhungsschreiben als PDF
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700">
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={!neueKalt || neueKalt <= 0}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-40"
            >
              ✅ Speichern & Anpassung hinterlegen
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center">
            Speichern trägt die neue Kaltmiete in den Mieteingänge-Verlauf ein und setzt das Datum der letzten Mieterhöhung.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MieterhoeungModal;
