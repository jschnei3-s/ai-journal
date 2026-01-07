import Stripe from "stripe";
import { NextResponse } from "next/server";

// Ensure this route runs in Node.js runtime (required for Stripe SDK)
export const runtime = "nodejs";

// Validate environment variables upfront
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePriceId = process.env.STRIPE_PRICE_MONTHLY;

let stripe: Stripe | null = null;

if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
  try {
    stripe = new Stripe(stripeSecretKey);
  } catch (err) {
    console.error("[STRIPE] Failed to initialize Stripe:", err);
  }
}

// Helper function to get the base URL for redirects
function getBaseUrl(req: Request): string {
  // 1. Try explicit environment variable first (most reliable for production)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // 2. Try to construct from request headers (works for Vercel)
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || 
                   (host?.includes("localhost") ? "http" : "https");
  
  if (host) {
    return `${protocol}://${host}`;
  }

  // 3. Fallback (shouldn't reach here in production)
  return "http://localhost:3000";
}

export async function POST(req: Request) {
  console.log("[STRIPE] Checkout session request received");
  console.log("[STRIPE] Environment check:");
  console.log("  - STRIPE_SECRET_KEY exists:", !!stripeSecretKey);
  console.log("  - STRIPE_SECRET_KEY valid:", stripeSecretKey?.startsWith('sk_'));
  console.log("  - STRIPE_PRICE_MONTHLY exists:", !!stripePriceId);
  console.log("  - STRIPE_PRICE_MONTHLY valid:", stripePriceId?.startsWith('price_'));
  console.log("  - NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL || "NOT SET");

  try {
    // Validate Stripe configuration
    if (!stripe) {
      const error = "Stripe is not configured. Please check STRIPE_SECRET_KEY environment variable.";
      console.error("[STRIPE ERROR]", error);
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    if (!stripePriceId || !stripePriceId.startsWith('price_')) {
      const error = `Stripe price ID is not configured. Current value: "${stripePriceId || "MISSING"}". Please check STRIPE_PRICE_MONTHLY environment variable.`;
      console.error("[STRIPE ERROR]", error);
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Get base URL for redirects
    const baseUrl = getBaseUrl(req);
    const successUrl = `${baseUrl}/billing/success`;
    const cancelUrl = `${baseUrl}/billing`;

    console.log("[STRIPE] Creating checkout session:");
    console.log("  - Base URL:", baseUrl);
    console.log("  - Success URL:", successUrl);
    console.log("  - Cancel URL:", cancelUrl);
    console.log("  - Price ID:", stripePriceId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log("[STRIPE] Checkout session created successfully:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[STRIPE ERROR] Full error details:");
    console.error("  - Type:", err?.type);
    console.error("  - Code:", err?.code);
    console.error("  - Message:", err?.message);
    console.error("  - Status Code:", err?.statusCode);
    console.error("  - Stack:", err?.stack);
    
    let errorMessage = "Failed to create checkout session";
    
    if (err?.type === 'StripeInvalidRequestError') {
      if (err.code === 'resource_missing') {
        errorMessage = `Invalid Stripe Price ID. The price ID "${stripePriceId}" does not exist in your Stripe account.`;
      } else if (err.code === 'invalid_request_error') {
        errorMessage = `Stripe API error: ${err.message}`;
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

