import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Check, ArrowRight, ArrowLeft, Gift, TrendingUp, FileText, Users, Loader2, UserPlus, LogIn, X, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ImpressumDatenschutzLinks } from '../components/ImpressumDatenschutz';
import { PARTNER_ANGEBOT, partnerVorteilKurz, partnerVorteilTitel, partnerVorteilText } from '../config/partner';
import { maklerSuchen, maklerPerCode, partnerMerken, partnerGemerkt, partnerMetadaten, initialen, markiere } from '../utils/partner';

// Landingpage hinter dem QR-Code auf den Makler-Visitenkarten (renditly.de/partner).
// Drei kurze Schritte wie ein Onboarding: Makler wählen → Vorteil sehen → Konto anlegen.
// Fast alle Besucher kommen vom Handy (QR-Scan) — deshalb mobil zuerst gebaut.

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-base font-black flex items-center justify-center">r</span>
      <span className="font-extrabold text-lg tracking-tight text-white">renditly</span>
    </span>
  );
}

function Fortschritt({ schritt }) {
  const namen = ['Makler', 'Vorteil', 'Konto'];
  return (
    <div className="flex items-center gap-2" aria-label={`Schritt ${schritt + 1} von 3`}>
      {namen.map((n, i) => (
        <div key={n} className="flex items-center gap-2 flex-1 last:flex-none">
          <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${i < schritt ? 'bg-emerald-500 text-white' : i === schritt ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
            {i < schritt ? <Check size={14} /> : i + 1}
          </span>
          <span className={`text-xs font-semibold ${i === schritt ? 'text-gray-900' : 'text-gray-400'} hidden sm:inline`}>{n}</span>
          {i < namen.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < schritt ? 'bg-emerald-400' : 'bg-gray-100'}`} />}
        </div>
      ))}
    </div>
  );
}

function Hervorgehoben({ text, q }) {
  return markiere(text, q).map((t, i) => t.treffer
    ? <mark key={i} className="bg-indigo-100 text-indigo-800 rounded px-0.5">{t.text}</mark>
    : <span key={i}>{t.text}</span>);
}

function Avatar({ text, gross = false }) {
  return (
    <span className={`${gross ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'} rounded-full bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center shrink-0`}>
      {initialen(text)}
    </span>
  );
}

// ── Schritt 1: Makler finden (Tippsuche statt Dropdown) ────────────────────────
function MaklerSchritt({ wahl, setWahl, weiter }) {
  const [q, setQ] = useState('');
  const [treffer, setTreffer] = useState([]);
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  const [freiModus, setFreiModus] = useState(false);
  const [frei, setFrei] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    let weg = false;
    setLaedt(true);
    const t = setTimeout(() => {
      maklerSuchen(q)
        .then(d => { if (!weg) { setTreffer(d); setFehler(false); setAktiv(0); } })
        .catch(() => { if (!weg) { setTreffer([]); setFehler(true); } })
        .finally(() => { if (!weg) setLaedt(false); });
    }, q ? 160 : 0);
    return () => { weg = true; clearTimeout(t); };
  }, [q]);

  const waehle = (m) => { setWahl({ id: m.id, name: m.name, firma: m.firma, ort: m.ort }); weiter(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAktiv(a => Math.min(a + 1, treffer.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setAktiv(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && treffer[aktiv]) { e.preventDefault(); waehle(treffer[aktiv]); }
  };

  if (freiModus) {
    return (
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Wie heißt dein Makler?</h2>
        <p className="text-sm text-gray-500 mt-1">Name oder Firma reicht — wir ordnen dich dann von Hand zu.</p>
        <input autoFocus value={frei} onChange={e => setFrei(e.target.value)} maxLength={120}
          onKeyDown={e => { if (e.key === 'Enter' && frei.trim()) { setWahl({ freitext: frei.trim() }); weiter(); } }}
          placeholder="z. B. Berger Immobilien" className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button disabled={!frei.trim()} onClick={() => { setWahl({ freitext: frei.trim() }); weiter(); }}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-40">
          Weiter <ArrowRight size={18} />
        </button>
        <button onClick={() => setFreiModus(false)} className="mt-3 w-full text-sm font-semibold text-gray-500 hover:text-gray-800">Zurück zur Liste</button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold text-gray-900">Von welchem Makler hast du die Karte?</h2>
      <p className="text-sm text-gray-500 mt-1">Tipp einfach die ersten Buchstaben von Name, Firma oder Ort.</p>
      <div className="relative mt-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input ref={inputRef} autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
          placeholder="z. B. Ber…" aria-label="Makler suchen" role="combobox" aria-expanded="true" aria-controls="makler-liste"
          className="w-full rounded-xl border border-gray-300 pl-11 pr-10 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {q && <button onClick={() => { setQ(''); inputRef.current?.focus(); }} aria-label="Eingabe löschen" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"><X size={16} /></button>}
      </div>

      <ul id="makler-liste" role="listbox" className="mt-3 space-y-2 min-h-[4rem]">
        {laedt && treffer.length === 0 && (
          <li className="flex items-center gap-2 text-sm text-gray-400 px-1 py-3"><Loader2 size={16} className="animate-spin" /> Suche…</li>
        )}
        {treffer.map((m, i) => (
          <li key={m.id} role="option" aria-selected={i === aktiv}>
            <button onClick={() => waehle(m)} onMouseEnter={() => setAktiv(i)}
              className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${i === aktiv || wahl?.id === m.id ? 'border-indigo-400 bg-indigo-50/60' : 'border-gray-200 hover:border-indigo-300'}`}>
              <Avatar text={m.firma || m.name} />
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-gray-900 truncate"><Hervorgehoben text={m.name} q={q} /></span>
                <span className="block text-sm text-gray-500 truncate">
                  {m.firma && <Hervorgehoben text={m.firma} q={q} />}{m.firma && m.ort && ' · '}{m.ort && <Hervorgehoben text={m.ort} q={q} />}
                </span>
              </span>
              {wahl?.id === m.id ? <Check size={18} className="text-indigo-600" /> : <ArrowRight size={16} className="text-gray-300" />}
            </button>
          </li>
        ))}
        {!laedt && treffer.length === 0 && (
          <li className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500">
            {fehler ? 'Die Liste lädt gerade nicht.' : q ? <>Kein Makler mit „{q}“ gefunden.</> : 'Noch keine Makler hinterlegt.'}
          </li>
        )}
      </ul>

      <button onClick={() => { setFrei(q); setFreiModus(true); }} className="mt-4 w-full text-sm font-semibold text-indigo-600 hover:text-indigo-800 py-2">
        Mein Makler ist nicht dabei
      </button>
    </div>
  );
}

// ── Schritt 2: Vorteil + kurz, was renditly ist ─────────────────────────────────
function VorteilSchritt({ wahl, weiter, zurueck }) {
  const titel = wahl?.id ? wahl.name : wahl?.freitext;
  const unter = wahl?.id ? [wahl.firma, wahl.ort].filter(Boolean).join(' · ') : null;
  return (
    <div>
      <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
        <Avatar text={wahl?.firma || titel} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Empfohlen von</div>
          <div className="font-bold text-gray-900 truncate">{titel}</div>
          {unter && <div className="text-xs text-gray-500 truncate">{unter}</div>}
        </div>
        <button onClick={zurueck} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Ändern</button>
      </div>

      <div className="mt-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-5 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" aria-hidden="true" />
        <div className="flex items-center gap-2 text-indigo-100 text-xs font-bold uppercase tracking-wide"><Gift size={15} /> Dein Partner-Vorteil</div>
        <div className="text-3xl font-black mt-2 tracking-tight">{partnerVorteilTitel()}</div>
        <p className="text-sm text-indigo-100 mt-1.5 leading-relaxed">{partnerVorteilText()}</p>
        <div className="mt-4 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">
          <Check size={13} /> Ist für dich hinterlegt
        </div>
      </div>

      <h2 className="text-lg font-extrabold text-gray-900 mt-6">Was du mit renditly bekommst</h2>
      <ul className="mt-3 space-y-3">
        {[
          { icon: TrendingUp, t: 'Cashflow jeder Wohnung', s: 'Monatlich vor und nach Tilgung — siehst sofort, ob sie sich trägt.' },
          { icon: FileText, t: 'Steuer fertig vorbereitet', s: 'AfA, Zinsen und Werbungskosten als PDF für den Steuerberater.' },
          { icon: Users, t: 'Mieter ohne Zettelwirtschaft', s: 'Mieteingänge, Kaution, Mieterhöhung und Nebenkosten an einem Ort.' },
        ].map(({ icon: I, t, s }) => (
          <li key={t} className="flex gap-3">
            <span className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><I size={18} /></span>
            <span><span className="block font-bold text-gray-900 text-sm">{t}</span><span className="block text-sm text-gray-500">{s}</span></span>
          </li>
        ))}
      </ul>

      <button onClick={weiter} className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
        {PARTNER_ANGEBOT.testphaseTage} Tage kostenlos starten <ArrowRight size={18} />
      </button>
      <p className="text-center text-xs text-gray-400 mt-2">Keine Kreditkarte · keine Mindestlaufzeit</p>
    </div>
  );
}

// ── Schritt 3: Konto anlegen (oder einloggen) ──────────────────────────────────
function KontoSchritt({ wahl, fertig, zurueck }) {
  const [modus, setModus] = useState('neu'); // 'neu' | 'login'
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState(null);

  const absenden = async (e) => {
    e.preventDefault();
    setFehler(null);
    if (pw.length < 6) { setFehler('Das Passwort braucht mindestens 6 Zeichen.'); return; }
    setLaedt(true);
    try {
      if (modus === 'neu') {
        const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { data: partnerMetadaten(wahl) } });
        if (error) throw error;
        fertig({ eingeloggt: !!data.session, email });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        fertig({ eingeloggt: true, email, bestand: true }); // Zuordnung erledigt die App beim Start (partner_zuordnen)
      }
    } catch (err) {
      const m = String(err?.message || '');
      setFehler(/already registered|already exists/i.test(m) ? 'Mit dieser E-Mail gibt es schon ein Konto — melde dich einfach an.'
        : /invalid login/i.test(m) ? 'E-Mail oder Passwort stimmen nicht.' : (m || 'Das hat nicht geklappt. Bitte versuch es noch einmal.'));
      if (/already registered|already exists/i.test(m)) setModus('login');
    } finally { setLaedt(false); }
  };

  return (
    <form onSubmit={absenden}>
      <button type="button" onClick={zurueck} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700 mb-3"><ArrowLeft size={14} /> Zurück</button>
      <h2 className="text-xl font-extrabold text-gray-900">{modus === 'neu' ? 'Konto anlegen' : 'Anmelden'}</h2>
      <p className="text-sm text-gray-500 mt-1">
        {modus === 'neu' ? 'Dein Partner-Vorteil wird direkt mit deinem Konto verknüpft.' : 'Wir verknüpfen den Partner-Vorteil mit deinem bestehenden Konto.'}
      </p>
      {fehler && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{fehler}</div>}
      <label className="block mt-4">
        <span className="text-sm font-semibold text-gray-700">E-Mail</span>
        <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </label>
      <label className="block mt-3">
        <span className="text-sm font-semibold text-gray-700">Passwort</span>
        <input type="password" required minLength={6} autoComplete={modus === 'neu' ? 'new-password' : 'current-password'} value={pw} onChange={e => setPw(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {modus === 'neu' && <span className="block text-xs text-gray-400 mt-1">Mindestens 6 Zeichen</span>}
      </label>
      <button type="submit" disabled={laedt} className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-60">
        {laedt ? <Loader2 size={18} className="animate-spin" /> : modus === 'neu' ? <UserPlus size={18} /> : <LogIn size={18} />}
        {modus === 'neu' ? 'Kostenlos registrieren' : 'Anmelden & verknüpfen'}
      </button>
      <button type="button" onClick={() => { setModus(m => m === 'neu' ? 'login' : 'neu'); setFehler(null); }}
        className="mt-3 w-full text-sm font-semibold text-indigo-600 hover:text-indigo-800 py-1">
        {modus === 'neu' ? 'Ich habe schon ein Konto' : 'Neues Konto anlegen'}
      </button>
      <p className="mt-4 flex items-start gap-1.5 text-xs text-gray-400"><ShieldCheck size={14} className="shrink-0 mt-0.5" /> Dein Makler sieht nur, dass du dich registriert hast — nie deine Immobilien oder Zahlen.</p>
    </form>
  );
}

function FertigSchritt({ ergebnis, wahl }) {
  const titel = wahl?.id ? (wahl.firma || wahl.name) : wahl?.freitext;
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check size={32} /></div>
      <h2 className="text-2xl font-extrabold text-gray-900 mt-4">Geschafft!</h2>
      <p className="text-gray-500 mt-2">
        {ergebnis.bestand ? 'Dein Konto ist jetzt' : 'Dein Konto ist angelegt und'} mit {titel ? <strong className="text-gray-800">{titel}</strong> : 'deinem Makler'} verknüpft.
      </p>
      {!ergebnis.eingeloggt && (
        <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">Falls du eine Bestätigungs-Mail bekommst: kurz auf den Link tippen, dann geht es los.</p>
      )}
      <a href="/app" className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
        Zu renditly <ArrowRight size={18} />
      </a>
    </div>
  );
}

export default function PartnerLanding() {
  const [schritt, setSchritt] = useState(0);
  const [wahl, setWahlState] = useState(() => partnerGemerkt());
  const [ergebnis, setErgebnis] = useState(null);

  const setWahl = (w) => { setWahlState(w); partnerMerken(w); };

  // Persönlicher QR-Code (?m=CODE): Makler vorauswählen und direkt zum Vorteil
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('m');
    if (!code) return;
    maklerPerCode(code).then(m => { if (m) { setWahl({ id: m.id, name: m.name, firma: m.firma, ort: m.ort }); setSchritt(1); } });
  }, []);

  useEffect(() => { window.scrollTo?.({ top: 0, behavior: 'smooth' }); }, [schritt]);

  const inhalt = useMemo(() => {
    if (ergebnis) return <FertigSchritt ergebnis={ergebnis} wahl={wahl} />;
    if (schritt === 0) return <MaklerSchritt wahl={wahl} setWahl={setWahl} weiter={() => setSchritt(1)} />;
    if (schritt === 1) return <VorteilSchritt wahl={wahl} weiter={() => setSchritt(2)} zurueck={() => setSchritt(0)} />;
    return <KontoSchritt wahl={wahl} fertig={setErgebnis} zurueck={() => setSchritt(1)} />;
  }, [schritt, wahl, ergebnis]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="font-app min-h-screen bg-gray-50 text-gray-900 antialiased">
      <header className="relative bg-ink text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-16 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-lg mx-auto px-5 pt-5 pb-24">
          <div className="flex items-center justify-between">
            <a href="/" aria-label="renditly Startseite"><Logo /></a>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-xs font-semibold text-indigo-100">
              <Gift size={13} /> {partnerVorteilKurz()}
            </span>
          </div>
          <h1 className="text-[1.7rem] sm:text-3xl font-extrabold leading-tight tracking-tight mt-8">
            Schön, dass du da bist. <span className="text-indigo-300">Dein Makler hat dir etwas mitgegeben.</span>
          </h1>
          <p className="text-white/70 mt-3 leading-relaxed">
            renditly zeigt dir, was deine Immobilie wirklich bringt — Cashflow, Steuer und Mieter an einem Ort.
          </p>
        </div>
      </header>

      <main className="relative max-w-lg mx-auto px-4 -mt-16 pb-12">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/5 border border-gray-200/70 p-5 sm:p-6">
          {!ergebnis && <div className="mb-5"><Fortschritt schritt={schritt} /></div>}
          {inhalt}
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-6 text-xs text-gray-400">
          {['Server in der EU', 'DSGVO-konform', 'Jederzeit kündbar'].map(t => (
            <span key={t} className="flex items-center gap-1"><Check size={13} className="text-emerald-500" />{t}</span>
          ))}
        </div>
        <div className="mt-6 text-center text-xs text-gray-400"><ImpressumDatenschutzLinks /></div>
      </main>
    </div>
  );
}
