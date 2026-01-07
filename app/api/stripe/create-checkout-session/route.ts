import Stripe from "stripe";
import { NextResponse } from "next/server";

// Ensure this route runs in Node.js runtime (required for Stripe SDK)
export const runtime = "nodejs";

// Validate environment variables upfront with safe initialization
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePriceId = process.env.STRIPE_PRICE_MONTHLY;

let stripe: Stripe | null = null;
let stripeInitError: string | null = null;

// Safe Stripe initialization - catch all errors to prevent module load failures
try {
  if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
    try {
      stripe = new Stripe(stripeSecretKey);
      console.log("[STRIPE] Stripe initialized successfully");
    } catch (err: any) {
      stripeInitError = err?.message || String(err);
      console.error("[STRIPE] Failed to initialize Stripe:", err);
    }
  } else {
    stripeInitError = stripeSecretKey ? "STRIPE_SECRET_KEY format is invalid (must start with 'sk_')" : "STRIPE_SECRET_KEY is missing";
    console.error("[STRIPE]", stripeInitError);
  }
} catch (err: any) {
  // Catch any unexpected errors during module initialization
  stripeInitError = `Module initialization error: ${err?.message || String(err)}`;
  console.error("[STRIPE] Critical initialization error:", err);
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

// Add GET handler to test if route is accessible
export async function GET() {
  console.log("[STRIPE] GET request received - testing route accessibility");
  return NextResponse.json({
    status: "Route is accessible",
    stripeConfigured: !!stripe,
    envVars: {
      STRIPE_SECRET_KEY: stripeSecretKey ? "SET" : "MISSING",
      STRIPE_PRICE_MONTHLY: stripePriceId ? "SET" : "MISSING",
    },
    stripeInitError: stripeInitError || null,
  });
}

export async function POST(req: Request) {
  // Log immediately to verify route is hit
  console.log("\n\n[STRIPE] =========================================");
  console.log("[STRIPE] POST request received at:", new Date().toISOString());
  console.log("[STRIPE] =========================================\n");
  
  try {
    console.log("[STRIPE] ==== CHECKOUT REQUEST START ====");
    console.log("[STRIPE] Request URL:", req.url);
    console.log("[STRIPE] Request method:", req.method);
    console.log("[STRIPE] Checkout session request received");
    console.log("[STRIPE] Environment check:");
    console.log("  - STRIPE_SECRET_KEY exists:", !!stripeSecretKey);
    console.log("  - STRIPE_SECRET_KEY valid:", stripeSecretKey?.startsWith('sk_'));
    console.log("  - STRIPE_SECRET_KEY length:", stripeSecretKey?.length || 0);
    console.log("  - STRIPE_PRICE_MONTHLY exists:", !!stripePriceId);
    console.log("  - STRIPE_PRICE_MONTHLY valid:", stripePriceId?.startsWith('price_'));
    console.log("  - STRIPE_PRICE_MONTHLY value:", stripePriceId || "MISSING");
    console.log("  - NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL || "NOT SET");
    console.log("  - Stripe client initialized:", !!stripe);
    console.log("  - Stripe init error:", stripeInitError || "none");
    
    // Validate Stripe configuration
    if (!stripe) {
      let error = stripeInitError || "Stripe is not configured.";
      
      if (!stripeSecretKey) {
        error = "STRIPE_SECRET_KEY environment variable is missing. Please add it in Vercel Dashboard → Settings → Environment Variables and redeploy.";
      } else if (!stripeSecretKey.startsWith('sk_')) {
        error = `STRIPE_SECRET_KEY format is invalid. It should start with 'sk_', but got: '${stripeSecretKey.substring(0, 10)}...'. Please check your Vercel environment variables.`;
      } else {
        error = `Stripe initialization failed: ${stripeInitError || "Unknown error"}. Please check your STRIPE_SECRET_KEY in Vercel.`;
      }
      
      console.error("[STRIPE ERROR]", error);
      console.error("[STRIPE ERROR] STRIPE_SECRET_KEY value:", stripeSecretKey ? `${stripeSecretKey.substring(0, 7)}...` : "MISSING");
      return NextResponse.json(
        { 
          error,
          details: {
            stripeSecretKeySet: !!stripeSecretKey,
            stripeSecretKeyValid: stripeSecretKey?.startsWith('sk_') || false,
            stripePriceIdSet: !!stripePriceId,
            stripePriceIdValid: stripePriceId?.startsWith('price_') || false,
            stripeInitError: stripeInitError || null,
          }
        },
        { status: 500 }
      );
    }

    if (!stripePriceId || !stripePriceId.startsWith('price_')) {
      const error = `STRIPE_PRICE_MONTHLY environment variable is ${stripePriceId ? `invalid (got: "${stripePriceId}")` : "missing"}. It should start with 'price_'. Please add it in Vercel Dashboard → Settings → Environment Variables and redeploy.`;
      console.error("[STRIPE ERROR]", error);
      return NextResponse.json(
        { 
          error,
          details: {
            stripePriceIdSet: !!stripePriceId,
            stripePriceIdValue: stripePriceId || "MISSING",
          }
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Get base URL for redirects
    const baseUrl = getBaseUrl(req);
    const successUrl = `${baseUrl}/billing/success`;
    const cancelUrl = `${baseUrl}/billing`;

    console.log("[STRIPE] Creating checkout session:");
    console.log("  - Request host header:", req.headers.get("host"));
    console.log("  - Request origin:", req.headers.get("origin"));
    console.log("  - Base URL:", baseUrl);
    console.log("  - Success URL:", successUrl);
    console.log("  - Cancel URL:", cancelUrl);
    console.log("  - Price ID:", stripePriceId);
    console.log("  - NEXT_PUBLIC_SITE_URL env:", process.env.NEXT_PUBLIC_SITE_URL || "NOT SET");

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
    console.error("[STRIPE ERROR] ==== FULL ERROR DETAILS ====");
    console.error("  - Type:", err?.type);
    console.error("  - Code:", err?.code);
    console.error("  - Message:", err?.message);
    console.error("  - Status Code:", err?.statusCode);
    console.error("  - Stack:", err?.stack);
    console.error("==========================================");
    
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
