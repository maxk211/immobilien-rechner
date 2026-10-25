/**
 * renditly Cookie-Consent-Banner
 *
 * Vanilla JS, kein React nötig — läuft identisch auf allen statischen
 * Entry-Seiten (Rechner, Ratgeber, Städte) und in der React-App, da alle
 * dasselbe <head>-Snippet einbinden. Steuert Google Consent Mode v2:
 * GA4 sendet erst nach "Akzeptieren" personenbezogene Daten.
 * Minilytics (setzt Cookies ml_vid/ml_sid) wird erst nach "Akzeptieren" geladen.
 */
(function () {
  // _v2: neue Einwilligung, seit Minilytics dazukam (alte Zustimmung galt nur für GA4).
  var STORAGE_KEY = 'renditly_cookie_consent_v2';

  // Puffer für window.minilytics?.(...)-Aufrufe aus der App, bis das Script geladen ist.
  // Ohne Einwilligung wird nie etwas gesendet.
  window.minilytics = window.minilytics || function () {
    (window.minilytics.q = window.minilytics.q || []).push(arguments);
  };

  function loadMinilytics() {
    if (document.querySelector('script[data-website-id="6i07223c6m6y331y"]')) return;
    var s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-website-id', '6i07223c6m6y331y');
    s.src = 'https://minilytics.hs24.workers.dev/js/script.js';
    document.head.appendChild(s);
  }

  function updateConsent(granted) {
    if (granted) loadMinilytics();
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }

  var stored = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    /* localStorage evtl. blockiert — dann kein Consent-Update, GA bleibt denied */
  }

  if (stored === 'granted') {
    updateConsent(true);
    return;
  }
  if (stored === 'denied') {
    return;
  }

  function showBanner() {
    var wrap = document.createElement('div');
    wrap.id = 'rc-banner';
    wrap.innerHTML =
      '<div class="rc-banner-inner">' +
      '<p class="rc-text">Wir nutzen Google Analytics und unser eigenes Analyse-Tool Minilytics (Cookies), um zu verstehen, wie renditly genutzt wird. Deine Daten werden nur mit deiner Einwilligung erfasst — jederzeit widerrufbar. Mehr dazu in unserer <a href="https://www.renditly.de/#datenschutz" class="rc-link">Datenschutzerklärung</a>.</p>' +
      '<div class="rc-actions">' +
      '<button type="button" id="rc-reject" class="rc-btn rc-btn-secondary">Ablehnen</button>' +
      '<button type="button" id="rc-accept" class="rc-btn rc-btn-primary">Akzeptieren</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    document.getElementById('rc-accept').addEventListener('click', function () {
      try { window.localStorage.setItem(STORAGE_KEY, 'granted'); } catch (e) {}
      updateConsent(true);
      wrap.remove();
    });
    document.getElementById('rc-reject').addEventListener('click', function () {
      try { window.localStorage.setItem(STORAGE_KEY, 'denied'); } catch (e) {}
      wrap.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
