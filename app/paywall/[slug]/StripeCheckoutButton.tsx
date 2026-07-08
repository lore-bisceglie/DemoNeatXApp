'use client';

import { useState } from 'react';

export default function StripeCheckoutButton({ tenantId, slug }: { tenantId: string, slug: string }) {
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
        body: JSON.stringify({ tenantId, slug }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la creazione del checkout');
      }

      if (data.url) {
        window.location.href = data.url; // Reindirizza a Stripe
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-extrabold text-white transition hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? 'Caricamento Stripe...' : '💳 Paga 29€ e Sblocca'}
      </button>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
