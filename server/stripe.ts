import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.");
    }
    stripeClient = new Stripe(key, { apiVersion: "2025-04-30.basil" });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
