// Sichtbare Autor:innen- und Aktualitäts-Angabe für Daten-/Statistikseiten.
// Echte Namen aus dem Impressum (ImmoBros GbR) — keine erfundenen Personas.

export default function ArticleMeta({
  autor = 'Maximilian Kammel',
  rolle = 'Mitgründer renditly',
  veroeffentlicht,
  aktualisiert,
  quelle,
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 mb-6">
      <span className="text-slate-500">
        Verfasst von <span className="font-semibold text-slate-600">{autor}</span>
        <span className="text-slate-400"> ({rolle})</span>
      </span>
      {veroeffentlicht && (
        <>
          <span className="opacity-40">·</span>
          <span>Veröffentlicht {veroeffentlicht}</span>
        </>
      )}
      {aktualisiert && (
        <>
          <span className="opacity-40">·</span>
          <span>Aktualisiert {aktualisiert}</span>
        </>
      )}
      {quelle && (
        <>
          <span className="opacity-40">·</span>
          <span>{quelle}</span>
        </>
      )}
    </div>
  );
}
