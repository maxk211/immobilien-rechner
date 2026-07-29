import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { PAYMENTS_LIVE, TRIAL_DAYS, PLANS, getMaxImmobilien } from '../config/payments';

// ─── useSubscription ──────────────────────────────────────────────────────────
//
// Gibt zurück:
//   plan           – 'free' | 'trial' | 'starter' | 'standard' | 'pro' | 'expired'
//   loading        – Subscription-Status wird noch geladen
//   canAddImmo     – Darf weitere Immobilie hinzufügen (nach Plan-Limit)
//   maxImmobilien  – Maximale Immobilien für aktuellen Plan (Infinity = unlimitiert)
//   isTrialing     – Läuft aktuell der Gratis-Trial
//   trialDaysLeft  – Verbleibende Trial-Tage
//   openCheckout   – (planKey, billing) => öffnet Stripe Checkout
//   refresh        – Subscription manuell neu laden (z.B. nach Checkout-Success)
//
// PAYMENTS_LIVE = false → plan = 'pro', keine Einschränkungen
// ─────────────────────────────────────────────────────────────────────────────

export function useSubscription(session, portfolioCount = 0) {
  const [plan, setPlan]               = useState(PAYMENTS_LIVE ? null : 'pro');
  const [isTrialing, setIsTrialing]   = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [loading, setLoading]         = useState(PAYMENTS_LIVE && !!session?.user);

  const checkOrInitSubscription = useCallback(async () => {
    if (!PAYMENTS_LIVE) {
      setPlan('pro');
      setLoading(false);
      return;
    }

    if (!session?.user) {
      setPlan('free');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan, trial_started_at, current_period_end, stripe_subscription_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Subscription-Abruf Fehler:', error);
        setPlan('free');
        return;
      }

      // ── Kein Eintrag → Trial starten ──────────────────────────────────────
      if (!data) {
        const trialStart = new Date().toISOString();
        const { error: insertErr } = await supabase
          .from('subscriptions')
          .insert({
            user_id:          session.user.id,
            status:           'trial',
            plan:             'trial',
            trial_started_at: trialStart,
          });

        if (insertErr) {
          // Insert-Konflikt: anderer Tab hat bereits einen Eintrag angelegt → neu abrufen
          if (insertErr.code === '23505') {
            await checkOrInitSubscription();
          } else {
            console.error('Trial-Insert Fehler:', insertErr);
            setPlan('free');
          }
          return;
        }

        setPlan('trial');
        setIsTrialing(true);
        setTrialDaysLeft(TRIAL_DAYS);
        return;
      }

      // ── Trial-Status prüfen ────────────────────────────────────────────────
      if (data.status === 'trial' || (data.plan === 'trial' && !data.stripe_subscription_id)) {
        const trialStart     = new Date(data.trial_started_at || new Date());
        const msElapsed      = Date.now() - trialStart.getTime();
        const daysElapsed    = msElapsed / (1000 * 60 * 60 * 24);
        const daysLeft       = Math.max(0, Math.ceil(TRIAL_DAYS - daysElapsed));
        const trialActive    = daysLeft > 0;

        setPlan(trialActive ? 'trial' : 'expired');
        setIsTrialing(trialActive);
        setTrialDaysLeft(daysLeft);
        return;
      }

      // ── Bezahltes Abo prüfen ───────────────────────────────────────────────
      const isActive = data.status === 'active' || data.status === 'trialing';
      const notExpired = data.current_period_end
        ? new Date(data.current_period_end) > new Date()
        : false;

      if (isActive && notExpired) {
        setPlan(data.plan || 'starter'); // plan aus DB (vom Webhook gesetzt)
        setIsTrialing(false);
        setTrialDaysLeft(0);
      } else {
        // Abo abgelaufen / gekündigt
        setPlan('expired');
        setIsTrialing(false);
        setTrialDaysLeft(0);
      }

    } catch (err) {
      console.error('useSubscription Fehler:', err);
      setPlan('free');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    checkOrInitSubscription();
  }, [checkOrInitSubscription]);

  // ── Checkout öffnen ──────────────────────────────────────────────────────
  const openCheckout = useCallback(async (planKey = 'starter', billing = 'monthly') => {
    if (!PAYMENTS_LIVE) return;

    const planConfig = PLANS[planKey];
    if (!planConfig?.prices) {
      console.error('Ungültiger Plan:', planKey);
      return;
    }

    const priceId = planConfig.prices[billing]?.id;
    if (!priceId) {
      console.error('Kein Price ID für', planKey, billing);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Checkout Fehler:', err);
    }
  }, []);

  // ── Limits berechnen ─────────────────────────────────────────────────────
  const effectivePlan    = plan || 'free';
  const maxImmobilien    = getMaxImmobilien(effectivePlan);
  const canAddImmo       = !PAYMENTS_LIVE
    || maxImmobilien === Infinity
    || portfolioCount < maxImmobilien;

  // Rückwärtskompatibilität: isPro = true wenn standard oder pro
  const isPro = ['standard', 'pro'].includes(effectivePlan);

  return {
    plan:          effectivePlan,
    isPro,
    loading,
    canAddImmo,
    maxImmobilien,
    isTrialing,
    trialDaysLeft,
    openCheckout,
    refresh:       checkOrInitSubscription,
  };
}
