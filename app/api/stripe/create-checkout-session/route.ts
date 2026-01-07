import Stripe from "stripe";
import { NextResponse } from "next/server";

// Validate environment variables upfront
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePriceId = process.env.STRIPE_PRICE_MONTHLY;

let stripe: Stripe | null = null;

if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
  try {
    stripe = new Stripe(stripeSecretKey);
  } catch (err) {
    console.error("Failed to initialize Stripe:", err);
  }
}

export async function POST(req: Request) {
  try {
    // Validate Stripe configuration
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please check STRIPE_SECRET_KEY environment variable." },
        { status: 500 }
      );
    }

    if (!stripePriceId || !stripePriceId.startsWith('price_')) {
      return NextResponse.json(
        { error: `Stripe price ID is not configured. Current value: "${stripePriceId || "MISSING"}". Please check STRIPE_PRICE_MONTHLY environment variable.` },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Figure out our base URL (works local + prod)
    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/billing/success`,
      cancel_url: `${origin}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    
    let errorMessage = "Failed to create checkout session";
    
    if (err?.type === 'StripeInvalidRequestError') {
      if (err.code === 'resource_missing') {
        errorMessage = `Invalid Stripe Price ID. The price ID does not exist in your Stripe account.`;
      } else {
        errorMessage = `Stripe API error: ${err.message}`;
      }
    } else if (err?.message) {
      errorMessage = err.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

