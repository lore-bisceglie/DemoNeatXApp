'use client';

import { useState } from 'react';

export default function StripeCheckoutButton({
  tenantId,
  slug,
  plan = 'pro',
  interval = 'month',
  priceId,
  label = 'Attiva Abbonamento',
  color = 'blue'
}: {
  tenantId: string,
  slug: string,
  plan?: string,
  interval?: string,
  priceId?: string,
  label?: string,
  color?: 'blue' | 'pink'
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId, slug, plan, interval, priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Errore durante la connessione a Stripe');
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const btnClass = color === 'pink'
    ? "w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-500 px-5 py-4 text-sm font-extrabold text-white transition hover:from-fuchsia-500 hover:to-pink-400 shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)]"
    : "w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-500 px-5 py-4 text-sm font-extrabold text-white transition hover:from-cyan-500 hover:to-blue-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]";

  return (
    <div className="w-full">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={btnClass}
      >
        {loading ? 'Attivazione in corso...' : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
