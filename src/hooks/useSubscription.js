import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PAYMENTS_LIVE, FREE_TIER } from '../config/payments';

// ─── useSubscription ──────────────────────────────────────────────────────────
//
// Gibt zurück:
//   isPro      – User hat aktives Pro-Abo (oder PAYMENTS_LIVE = false → immer true)
//   loading    – Subscription-Status wird noch geladen
//   canAddImmo – Darf weitere Immobilie hinzufügen
//   openCheckout – Öffnet Stripe Checkout (noop wenn PAYMENTS_LIVE = false)
//
// Solange PAYMENTS_LIVE = false: isPro immer true, keine Einschränkungen
// ─────────────────────────────────────────────────────────────────────────────

export function useSubscription(session, portfolioCount = 0) {
  const [isPro, setIsPro] = useState(!PAYMENTS_LIVE);
  const [loading, setLoading] = useState(PAYMENTS_LIVE && !!session?.user);

  useEffect(() => {
    if (!PAYMENTS_LIVE) {
      setIsPro(true);
      setLoading(false);
      return;
    }

    if (!session?.user) {
      setIsPro(false);
      setLoading(false);
      return;
    }

    const checkSubscription = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', session.user.id)
          .single();

        if (error || !data) {
          setIsPro(false);
        } else {
          const isActive = data.status === 'active' || data.status === 'trialing';
          const notExpired = data.current_period_end
            ? new Date(data.current_period_end) > new Date()
            : false;
          setIsPro(isActive && notExpired);
        }
      } catch {
        setIsPro(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [session]);

  const canAddImmo = !PAYMENTS_LIVE || isPro || portfolioCount < FREE_TIER.maxImmobilien;

  const openCheckout = async () => {
    if (!PAYMENTS_LIVE) return; // noop — Payments noch nicht aktiv

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { userId: session?.user?.id },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Checkout Fehler:', err);
    }
  };

  return { isPro, loading, canAddImmo, openCheckout };
}
