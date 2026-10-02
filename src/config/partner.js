// Partner-Programm (QR-Code auf Makler-Visitenkarten → renditly.de/partner)
//
// RABATT: noch nicht festgelegt. So schaltet ihr ihn später scharf:
//   1. In Stripe einen Gutschein (Coupon) anlegen, z. B. "20 % für 12 Monate".
//   2. Die Coupon-ID als Supabase-Secret PARTNER_STRIPE_COUPON setzen
//      (GitHub-Secret gleichen Namens, der Deploy-Workflow reicht es durch).
//      Ab dann zieht create-checkout den Rabatt für zugeordnete Nutzer automatisch ab.
//   3. Hier `rabatt` mit dem Text füllen, den die Landingpage zeigen soll.
// Solange `rabatt` null ist, zeigt die Seite einen neutralen "Partner-Vorteil".

export const PARTNER_URL = 'https://www.renditly.de/partner';

export const PARTNER_ANGEBOT = {
  rabatt: null,            // z. B. { kurz: '20 %', text: '20 % Rabatt im ersten Jahr' }
  testphaseTage: 90,       // Testphase, wie für alle Nutzer
};

export const partnerVorteilKurz = () => PARTNER_ANGEBOT.rabatt?.kurz || 'Partner-Vorteil';
export const partnerVorteilTitel = () => PARTNER_ANGEBOT.rabatt?.kurz || 'Exklusiv für dich';
export const partnerVorteilText = () => PARTNER_ANGEBOT.rabatt?.text
  || 'Dein Vorteil ist reserviert und wird bei deinem Upgrade automatisch berücksichtigt.';

export const MAKLER_STATUS = {
  angeschrieben: { label: 'Angeschrieben', farbe: 'bg-amber-50 text-amber-700 border-amber-200' },
  aufgenommen: { label: 'Aufgenommen', farbe: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pausiert: { label: 'Pausiert', farbe: 'bg-gray-100 text-gray-500 border-gray-200' },
};
