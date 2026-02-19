import { Router } from "express";
import { storage } from "../storage";
import { getStripe, isStripeConfigured } from "../stripe";
import { optionalMember, requireMember } from "../memberAuth";
import { requireAuth } from "../auth";
import type { Request, Response } from "express";

const router = Router();

function requireStripe(_req: Request, res: Response, next: () => void) {
  if (!isStripeConfigured()) {
    return res.status(503).json({ message: "Online giving is not configured. Contact the church office." });
  }
  next();
}

// GET /api/config
router.get("/config", (_req, res) => {
  res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
  });
});

// GET /api/giving/funds
router.get("/funds", async (_req, res) => {
  const funds = await storage.getFundCategories(true);
  res.json(funds);
});

// POST /api/giving/checkout-session
router.post("/checkout-session", requireStripe, optionalMember, async (req, res) => {
  const stripe = getStripe();
  const { amountCents, fundCategoryId, type, frequency, successUrl, cancelUrl } = req.body;

  if (!amountCents || amountCents < 100) {
    return res.status(400).json({ message: "Minimum donation is $1.00" });
  }

  if (!fundCategoryId) {
    return res.status(400).json({ message: "Fund category is required" });
  }

  const fund = await storage.getFundCategory(fundCategoryId);
  if (!fund) {
    return res.status(404).json({ message: "Fund category not found" });
  }

  // Get or create Stripe customer for logged-in member
  let customerId: string | undefined;
  if (req.member) {
    const member = await storage.getMember(req.member.memberId);
    if (member?.stripeCustomerId) {
      customerId = member.stripeCustomerId;
    } else if (member) {
      const customer = await stripe.customers.create({
        email: member.email,
        name: `${member.firstName} ${member.lastName}`,
        metadata: { memberId: member.id },
      });
      await storage.updateMember(member.id, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }
  }

  const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;

  if (type === "recurring" && frequency) {
    // Create a subscription via Checkout
    const priceData: any = {
      currency: "usd",
      unit_amount: amountCents,
      recurring: {
        interval: frequency === "weekly" ? "week" : "month",
      },
      product_data: {
        name: `${fund.name} - Recurring Donation`,
      },
    };

    const sessionParams: any = {
      mode: "subscription",
      line_items: [{ price_data: priceData, quantity: 1 }],
      success_url: successUrl || `${origin}/give?success=true`,
      cancel_url: cancelUrl || `${origin}/give?canceled=true`,
      metadata: { fundCategoryId, memberId: req.member?.memberId || "" },
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_creation = "always";
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Record pending donation
    await storage.createDonation({
      memberId: req.member?.memberId || null,
      fundCategoryId,
      amountCents,
      currency: "usd",
      type: "recurring",
      frequency,
      stripeCheckoutSessionId: session.id,
      status: "pending",
    });

    res.json({ url: session.url, sessionId: session.id });
  } else {
    // One-time donation via Checkout
    const sessionParams: any = {
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: { name: `${fund.name} - Donation` },
        },
        quantity: 1,
      }],
      payment_intent_data: {
        setup_future_usage: customerId ? "on_session" : undefined,
        metadata: { fundCategoryId, memberId: req.member?.memberId || "" },
      },
      success_url: successUrl || `${origin}/give?success=true`,
      cancel_url: cancelUrl || `${origin}/give?canceled=true`,
      metadata: { fundCategoryId, memberId: req.member?.memberId || "" },
    };

    if (customerId) {
      sessionParams.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await storage.createDonation({
      memberId: req.member?.memberId || null,
      fundCategoryId,
      amountCents,
      currency: "usd",
      type: "one_time",
      stripeCheckoutSessionId: session.id,
      status: "pending",
    });

    res.json({ url: session.url, sessionId: session.id });
  }
});

// POST /api/giving/charge-saved
router.post("/charge-saved", requireStripe, requireMember, async (req, res) => {
  const stripe = getStripe();
  const { paymentMethodId, amountCents, fundCategoryId } = req.body;

  if (!paymentMethodId || !amountCents || !fundCategoryId) {
    return res.status(400).json({ message: "Payment method, amount, and fund are required" });
  }

  if (amountCents < 100) {
    return res.status(400).json({ message: "Minimum donation is $1.00" });
  }

  const member = await storage.getMember(req.member!.memberId);
  if (!member?.stripeCustomerId) {
    return res.status(400).json({ message: "No saved payment methods" });
  }

  const fund = await storage.getFundCategory(fundCategoryId);
  if (!fund) {
    return res.status(404).json({ message: "Fund category not found" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: member.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `${fund.name} - Donation`,
      metadata: { fundCategoryId, memberId: member.id },
    });

    const donation = await storage.createDonation({
      memberId: member.id,
      fundCategoryId,
      amountCents,
      currency: "usd",
      type: "one_time",
      stripePaymentIntentId: paymentIntent.id,
      status: paymentIntent.status === "succeeded" ? "succeeded" : "pending",
    });

    res.json(donation);
  } catch (err: any) {
    return res.status(400).json({ message: err.message || "Payment failed" });
  }
});

// GET /api/giving/payment-methods
router.get("/payment-methods", requireStripe, requireMember, async (req, res) => {
  const stripe = getStripe();
  const member = await storage.getMember(req.member!.memberId);
  if (!member?.stripeCustomerId) {
    return res.json([]);
  }

  const methods = await stripe.paymentMethods.list({
    customer: member.stripeCustomerId,
    type: "card",
  });

  res.json(methods.data.map((m) => ({
    id: m.id,
    brand: m.card?.brand,
    last4: m.card?.last4,
    expMonth: m.card?.exp_month,
    expYear: m.card?.exp_year,
  })));
});

// DELETE /api/giving/payment-methods/:id
router.delete("/payment-methods/:id", requireStripe, requireMember, async (req, res) => {
  const stripe = getStripe();
  await stripe.paymentMethods.detach(req.params.id);
  res.json({ message: "Payment method removed" });
});

// GET /api/giving/history
router.get("/history", requireMember, async (req, res) => {
  const donations = await storage.getMemberDonationHistory(req.member!.memberId);
  res.json(donations);
});

// POST /api/giving/webhook
router.post("/webhook", async (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(503).end();
  }

  const stripe = getStripe();
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).end();
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody as string | Buffer, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: "Invalid signature" });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const donation = await storage.getDonationByStripeCheckoutSession(session.id);
      if (donation) {
        const updates: Record<string, any> = { status: "succeeded" };
        if (session.payment_intent) {
          updates.stripePaymentIntentId = session.payment_intent;
        }
        if (session.subscription) {
          updates.stripeSubscriptionId = session.subscription;
        }
        await storage.updateDonation(donation.id, updates);

        // Link Stripe customer to member if not already linked
        if (donation.memberId && session.customer) {
          const member = await storage.getMember(donation.memberId);
          if (member && !member.stripeCustomerId) {
            await storage.updateMember(member.id, { stripeCustomerId: session.customer });
          }
        }
      }
      break;
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object as any;
      const donation = await storage.getDonationByStripePaymentIntent(pi.id);
      if (donation) {
        await storage.updateDonation(donation.id, {
          status: "succeeded",
          receiptUrl: pi.charges?.data?.[0]?.receipt_url || null,
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as any;
      const donation = await storage.getDonationByStripePaymentIntent(pi.id);
      if (donation) {
        await storage.updateDonation(donation.id, { status: "failed" });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const donation = await storage.getDonationByStripeSubscription(invoice.subscription);
        if (donation) {
          await storage.updateDonation(donation.id, { status: "succeeded" });
        }
      }
      break;
    }
  }

  res.json({ received: true });
});

// ========== Admin ==========

// POST /api/admin/funds
router.post("/admin/funds", requireAuth, async (req, res) => {
  const { name, description, isActive, orderIndex } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Fund name is required" });
  }

  // Create Stripe Product if Stripe is configured
  let stripeProductId: string | undefined;
  if (isStripeConfigured()) {
    const stripe = getStripe();
    const product = await stripe.products.create({
      name,
      description: description || undefined,
    });
    stripeProductId = product.id;
  }

  const fund = await storage.createFundCategory({
    name,
    description,
    isActive: isActive !== false,
    orderIndex: orderIndex || 0,
  });

  if (stripeProductId) {
    await storage.updateFundCategory(fund.id, { stripeProductId } as any);
  }

  res.status(201).json(fund);
});

// PATCH /api/admin/funds/:id
router.patch("/admin/funds/:id", requireAuth, async (req, res) => {
  const fund = await storage.getFundCategory(req.params.id);
  if (!fund) {
    return res.status(404).json({ message: "Fund category not found" });
  }
  const { name, description, isActive, orderIndex } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (isActive !== undefined) updates.isActive = isActive;
  if (orderIndex !== undefined) updates.orderIndex = orderIndex;

  const updated = await storage.updateFundCategory(req.params.id, updates);
  res.json(updated);
});

// GET /api/admin/donations
router.get("/admin/donations", requireAuth, async (_req, res) => {
  const allDonations = await storage.getDonations();
  res.json(allDonations);
});

export default router;
