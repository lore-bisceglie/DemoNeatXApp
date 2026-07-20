import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummyKeyForBuild', {
  apiVersion: '2026-06-24.dahlia' as any,
  typescript: true,
});
