import { useState } from 'react';
import { Receipt, Lightbulb, FileText, Wallet, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import { NK_KOSTENPOSITIONEN_DEFAULTS } from '../constants/index.js';
import NKAbrechnungForm from './NKAbrechnungForm';

const NKAbrechnungTab = ({ params, updateParams, immobilie, mieterListe = [] }) => {
  const aktuellesJahr = new Date().getFullYear();
  const [filterJahr, setFilterJahr] = useState(aktuellesJahr - 1);
  const [showForm, setShowForm] = useState(false);
  const [editAbrechnung, setEditAbrechnung] = useState(null); // null = neu, sonst Objekt

  const nkAbrechnungen = params.nkAbrechnungen || [];
  const jahresAbrechnungen = nkAbrechnungen.filter(a => a.abrechnungsjahr === filterJahr && a.typ === 'nk_abrechnung_detail');

  // Vorauszahlungen aus Mieteingängen für das Jahr berechnen
  const nkVomMieter = params.nebenkostenVomMieter || 0;
  const vorauszahlungenGesamt = nkVomMieter * 12;

  const saveAbrechnung = (abrechnung) => {
    let updated;
    if (abrechnung.id && nkAbrechnungen.find(a => a.id === abrechnung.id)) {
      updated = nkAbrechnungen.map(a => a.id === abrechnung.id ? abrechnung : a);
    } else {
      updated = [...nkAbrechnungen, { ...abrechnung, id: Date.now(), typ: 'nk_abrechnung_detail', erstellt: new Date().toISOString() }];
    }
    updateParams({ ...params, nkAbrechnungen: updated });
    setShowForm(false);
    setEditAbrechnung(null);
  };

  const deleteAbrechnung = (id) => {
    updateParams({ ...params, nkAbrechnungen: nkAbrechnungen.filter(a => a.id !== id) });
  };

  // Neue leere Abrechnung — Mietername vorbefüllen, wenn eindeutig ein aktiver Mieter vorhanden ist
  const aktiveMieter = mieterListe.filter(m => m.aktiv !== false);
  const neueAbrechnung = {
    abrechnungsjahr: filterJahr,
    mieterName: aktiveMieter.length === 1 ? (aktiveMieter[0].name || '') : '',
    wohnflaeche: params.wohnflaeche || 0,
    gesamtflaeche: params.wohnflaeche || 0,
    vorauszahlungen: vorauszahlungenGesamt,
    kostenpositionen: NK_KOSTENPOSITIONEN_DEFAULTS.map(pos => ({ ...pos, gesamtkosten: 0, mieteranteil: 100 })),
    notizen: '',
  };

  const jahre = [];
  const kaufjahr = params.kaufdatum ? new Date(params.kaufdatum).getFullYear() : aktuellesJahr - 3;
  for (let j = kaufjahr; j <= aktuellesJahr; j++) jahre.push(j);

  if (showForm) {
    const abr = editAbrechnung || neueAbrechnung;
    return <NKAbrechnungForm abrechnung={abr} onSave={saveAbrechnung} onCancel={() => { setShowForm(false); setEditAbrechnung(null); }} mieterListe={mieterListe} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-cream-800 flex items-center gap-2"><Receipt size={16} /> NK-Abrechnungen</h3>
            <p className="text-xs text-cream-500 mt-0.5">Jährliche Betriebskostenabrechnung mit dem Mieter</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-clay-600 text-white text-sm font-bold rounded-xl hover:bg-clay-700 transition-colors">
            + Neue Abrechnung
          </button>
        </div>
        {/* Jahresauswahl */}
        <div className="flex gap-1 mt-4 flex-wrap">
          {jahre.map(j => (
            <button key={j} onClick={() => setFilterJahr(j)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${filterJahr === j ? 'bg-cream-900 text-white' : 'bg-cream-100 text-cream-600 hover:bg-cream-200'}`}>
              {j}
            </button>
          ))}
        </div>
      </div>

      {/* NK-Vorauszahlungen Info */}
      {nkVomMieter > 0 && (
        <div className="bg-clay-50 border border-clay-200 rounded-2xl p-4 text-sm">
          <div className="font-semibold text-clay-800 flex items-center gap-1"><Lightbulb size={14} /> Vorauszahlungen {filterJahr}</div>
          <div className="text-clay-700 mt-1">
            {nkVomMieter > 0 ? `${formatCurrency(nkVomMieter)}/Monat × 12 = ` : ''}<strong>{formatCurrency(vorauszahlungenGesamt)}</strong> Vorauszahlungen erhalten
          </div>
        </div>
      )}

      {/* Abrechnungsliste */}
      {jahresAbrechnungen.length === 0 ? (
        <div className="bg-white border border-dashed border-cream-300 rounded-2xl p-10 text-center">
          <div className="flex justify-center mb-3"><FileText size={40} className="text-cream-300" /></div>
          <div className="text-cream-500 font-semibold">Noch keine NK-Abrechnung für {filterJahr}</div>
          <div className="text-cream-400 text-sm mt-1">Erstelle die jährliche Betriebskostenabrechnung für den Mieter</div>
          <button onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-clay-600 text-white text-sm font-bold rounded-xl hover:bg-clay-700">
            Abrechnung erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jahresAbrechnungen.map(abr => {
            const gesamtkosten = (abr.kostenpositionen || []).reduce((s, k) => s + (k.gesamtkosten * (k.mieteranteil / 100) || 0), 0);
            const saldo = (abr.vorauszahlungen || 0) - gesamtkosten;
            const istErstattung = saldo > 0;
            return (
              <div key={abr.id} className="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold text-cream-800">NK-Abrechnung {abr.abrechnungsjahr}</div>
                    {abr.mieterName && <div className="text-sm text-cream-500">Mieter: {abr.mieterName}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditAbrechnung(abr); setShowForm(true); }} className="text-clay-500 hover:text-clay-700 text-xs font-semibold">Bearbeiten</button>
                    <button onClick={() => deleteAbrechnung(abr.id)} className="text-brick-400 hover:text-brick-600 text-xs">Löschen</button>
                  </div>
                </div>
                {/* Kostenpositionen */}
                <div className="space-y-1.5 mb-4">
                  {(abr.kostenpositionen || []).filter(k => k.gesamtkosten > 0).map(pos => (
                    <div key={pos.key} className="flex items-center justify-between text-sm">
                      <span className="text-cream-600">{pos.icon} {pos.label}</span>
                      <div className="text-right">
                        <span className="font-semibold text-cream-800">{formatCurrency(pos.gesamtkosten * (pos.mieteranteil / 100))}</span>
                        {pos.mieteranteil !== 100 && <span className="text-xs text-cream-400 ml-1">({pos.mieteranteil}% von {formatCurrency(pos.gesamtkosten)})</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Saldo */}
                <div className="border-t border-cream-200 pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-cream-500">Tatsächliche Kosten (Mieteranteil)</span>
                    <span className="font-semibold">{formatCurrency(gesamtkosten)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cream-500">Vorauszahlungen</span>
                    <span className="font-semibold text-clay-600">−{formatCurrency(abr.vorauszahlungen || 0)}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-bold p-2 rounded-lg ${istErstattung ? 'bg-honey-50 text-honey-700' : 'bg-sage-50 text-sage-700'}`}>
                    <span className="flex items-center gap-1">{istErstattung ? <><Wallet size={14} /> Erstattung an Mieter</> : <><TrendingDown size={14} /> Nachzahlung vom Mieter</>}</span>
                    <span>{formatCurrency(Math.abs(saldo))}</span>
                  </div>
                </div>
                {abr.notizen && <p className="text-xs text-cream-500 mt-2">{abr.notizen}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// NK-Abrechnung Formular

export default NKAbrechnungTab;
