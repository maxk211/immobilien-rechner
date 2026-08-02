// Lazy-Loader für schwere Export-Bibliotheken (xlsx, jsPDF + autotable).
//
// Diese Libraries werden nur beim PDF-/Excel-Export gebraucht, aber nicht
// beim normalen Dashboard-Betrieb. Statischer Import würde sie in jeden
// initialen Bundle-Load ziehen (~300-400 KB zusätzlich). Mit dynamic
// import() laden sie erst beim ersten tatsächlichen Export-Klick — danach
// bleiben sie im Browser-Cache und sind bei weiteren Exports sofort da.

let xlsxPromise = null;
export function getXLSX() {
  if (!xlsxPromise) {
    xlsxPromise = import('xlsx');
  }
  return xlsxPromise;
}

let jsPDFPromise = null;
export function getJsPDF() {
  if (!jsPDFPromise) {
    jsPDFPromise = Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]).then(([{ default: jsPDF }, { applyPlugin }]) => {
      applyPlugin(jsPDF);
      return jsPDF;
    });
  }
  return jsPDFPromise;
}
