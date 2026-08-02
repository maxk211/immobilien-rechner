/**
 * renditly Cookie-Consent-Banner
 *
 * Vanilla JS, kein React nötig — läuft identisch auf allen statischen
 * Entry-Seiten (Rechner, Ratgeber, Städte) und in der React-App, da alle
 * dasselbe <head>-Snippet einbinden. Steuert Google Consent Mode v2:
 * GA4 sendet erst nach "Akzeptieren" personenbezogene Daten.
 */
(function () {
  var STORAGE_KEY = 'renditly_cookie_consent';

  function updateConsent(granted) {
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
      '<p class="rc-text">Wir nutzen Google Analytics, um zu verstehen, wie renditly genutzt wird. Deine Daten werden nur mit deiner Einwilligung erfasst — jederzeit widerrufbar. Mehr dazu in unserer <a href="https://www.renditly.de/#datenschutz" class="rc-link">Datenschutzerklärung</a>.</p>' +
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
