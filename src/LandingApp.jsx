import LandingPage from './LandingPage';

// Reine Marketing-Landingpage auf "/" — kein Session-Check, kein Supabase-Call.
// Login/Registrierung führt zu "/app", wo Auth + Dashboard leben.
export default function LandingApp() {
  return (
    <LandingPage
      onGetStarted={() => { window.location.href = '/app'; }}
      onLogin={() => { window.location.href = '/app'; }}
    />
  );
}
