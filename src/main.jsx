import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// App (Dashboard) und LandingApp (Marketing) lazy laden — sonst landet
// die komplette Dashboard-Logik (PDF, Excel, Charts) im Bundle jeder Route,
// auch wenn nur die Landingpage aufgerufen wird.
const App = lazy(() => import('./App.jsx'))
const LandingApp = lazy(() => import('./LandingApp.jsx'))
const MietrenditeRechner = lazy(() => import('./rechner/MietrenditeRechner.jsx'))
const AfaRechner = lazy(() => import('./rechner/AfaRechner.jsx'))
const VermieterSoftwareLanding = lazy(() => import('./landing/VermieterSoftwareLanding.jsx'))
const MietrenditeGuide = lazy(() => import('./ratgeber/MietrenditeGuide.jsx'))
const CashflowGuide = lazy(() => import('./ratgeber/CashflowGuide.jsx'))
const AfaSteuerGuide = lazy(() => import('./ratgeber/AfaSteuerGuide.jsx'))
const NebenkostenGuide = lazy(() => import('./ratgeber/NebenkostenGuide.jsx'))
const MietspiegelGuide = lazy(() => import('./ratgeber/MietspiegelGuide.jsx'))
const GrunderwerbsteuerGuide = lazy(() => import('./ratgeber/GrunderwerbsteuerGuide.jsx'))
const SpekulationssteuerGuide = lazy(() => import('./ratgeber/SpekulationssteuerGuide.jsx'))
const MieterhoehungModernisierungGuide = lazy(() => import('./ratgeber/MieterhoehungModernisierungGuide.jsx'))
const EigenbedarfskuendigungGuide = lazy(() => import('./ratgeber/EigenbedarfskuendigungGuide.jsx'))
const ImmobilienfinanzierungGuide = lazy(() => import('./ratgeber/ImmobilienfinanzierungGuide.jsx'))
const ErbschaftsteuerImmobilieGuide = lazy(() => import('./ratgeber/ErbschaftsteuerImmobilieGuide.jsx'))
const RatgeberUebersicht = lazy(() => import('./ratgeber/RatgeberUebersicht.jsx'))
const StadtSeite = lazy(() => import('./staedte/StadtSeite.jsx'))
const StaedteVergleich = lazy(() => import('./staedte/StaedteVergleich.jsx'))
const StaedtVergleichSeite = lazy(() => import('./staedte/StaedtVergleichSeite.jsx'))

const root = ReactDOM.createRoot(document.getElementById('root'))

const Loading = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-white text-sm opacity-60">Laden…</div>
  </div>
)

const STAEDTE_SLUGS = ['berlin', 'hamburg', 'muenchen', 'koeln', 'frankfurt', 'stuttgart', 'duesseldorf', 'leipzig', 'dortmund', 'essen', 'bremen', 'hannover', 'dresden', 'nuernberg', 'mannheim', 'bonn', 'muenster', 'karlsruhe']

// Rechner-, Ratgeber- und Städte-Routen ohne Auth — SPA-Fallback bedient diese via /*→index.html
// Die dedizierten *.html-Dateien bedienen Crawler direkt (SEO)
const ROUTES = {
  '/mietrendite-rechner': { Component: MietrenditeRechner },
  '/afa-rechner': { Component: AfaRechner },
  '/vermieter-software': { Component: VermieterSoftwareLanding },
  '/ratgeber': { Component: RatgeberUebersicht },
  '/ratgeber/mietrendite-berechnen': { Component: MietrenditeGuide },
  '/ratgeber/cashflow-bei-immobilien': { Component: CashflowGuide },
  '/ratgeber/afa-und-steuern-vermietung': { Component: AfaSteuerGuide },
  '/ratgeber/nebenkostenabrechnung-vermieter': { Component: NebenkostenGuide },
  '/ratgeber/mietspiegel-verstehen': { Component: MietspiegelGuide },
  '/ratgeber/grunderwerbsteuer-bundeslaender': { Component: GrunderwerbsteuerGuide },
  '/ratgeber/spekulationssteuer-immobilienverkauf': { Component: SpekulationssteuerGuide },
  '/ratgeber/mieterhoehung-modernisierung': { Component: MieterhoehungModernisierungGuide },
  '/ratgeber/eigenbedarfskuendigung': { Component: EigenbedarfskuendigungGuide },
  '/ratgeber/immobilienfinanzierung': { Component: ImmobilienfinanzierungGuide },
  '/ratgeber/erbschaftsteuer-immobilie': { Component: ErbschaftsteuerImmobilieGuide },
  '/mietrendite-staedte': { Component: StaedteVergleich },
}
for (const slug of STAEDTE_SLUGS) {
  ROUTES[`/mietrendite-${slug}`] = { Component: StadtSeite, props: { slug } }
}

const STAEDTE_VERGLEICHE = [
  ['berlin', 'leipzig'],
  ['berlin', 'hamburg'],
  ['muenchen', 'frankfurt'],
  ['koeln', 'duesseldorf'],
  ['dortmund', 'essen'],
  ['stuttgart', 'muenchen'],
  ['leipzig', 'dortmund'],
  ['hamburg', 'muenchen'],
  ['berlin', 'muenchen'],
  ['frankfurt', 'duesseldorf'],
]
for (const [slugA, slugB] of STAEDTE_VERGLEICHE) {
  ROUTES[`/mietrendite-${slugA}-vs-${slugB}`] = { Component: StaedtVergleichSeite, props: { slugA, slugB } }
}

const path = window.location.pathname
const route = path === '/app' ? { Component: App } : (ROUTES[path] || { Component: LandingApp })

root.render(
  <React.StrictMode>
    <Suspense fallback={<Loading />}>
      <route.Component {...(route.props || {})} />
    </Suspense>
  </React.StrictMode>
)
