"use client";

import { Button } from "@/components/ui/Button";
import { Check, Crown } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

export function SubscriptionCard() {
  const { subscriptionStatus } = useSubscription();
  const isPremium = subscriptionStatus === "premium";

    const handleUpgrade = async () => {
    try {
      console.log("[CHECKOUT] Starting checkout session creation...");
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      console.log("[CHECKOUT] Response status:", res.status, res.statusText);
      console.log("[CHECKOUT] Response ok:", res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[CHECKOUT] API error response (raw):", errorText);
        console.error("[CHECKOUT] Response status:", res.status);
        console.error("[CHECKOUT] Response headers:", Object.fromEntries(res.headers.entries()));
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error("[CHECKOUT] Parsed JSON error:", errorData);
        } catch (parseErr) {
          console.error("[CHECKOUT] Failed to parse error as JSON:", parseErr);
          errorData = { error: errorText || "Unknown error", raw: errorText };
        }
        const errorMessage = errorData.error || errorData.message || errorData.raw || `HTTP ${res.status}: ${res.statusText}`;
        console.error("[CHECKOUT] Final error message:", errorMessage);
        
        // Show detailed error to help debug
        const detailedError = `Error: ${errorMessage}\n\nStatus: ${res.status}\n\nPlease check:\n1. Vercel environment variables are set\n2. STRIPE_SECRET_KEY starts with 'sk_'\n3. STRIPE_PRICE_MONTHLY starts with 'price_'\n\nSee browser console for full details.`;
        alert(detailedError);
        return;
      }

      console.log("[CHECKOUT] Response is OK, parsing JSON...");
      const data = await res.json();
      console.log("[CHECKOUT] Success response:", data);
      console.log("[CHECKOUT] Data URL exists:", !!data.url);

      if (!data.url) {
        console.error("[CHECKOUT] No URL in response:", data);
        alert("Stripe did not return a checkout URL.");
        return;
      }

      console.log("[CHECKOUT] Redirecting to:", data.url);
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("[CHECKOUT] Network/fetch error:", err);
      alert(`Something went wrong starting checkout: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };


  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
          <p className="text-sm text-gray-600 mt-1">
            {isPremium ? "Premium" : "Free"} Plan
          </p>
        </div>
        {isPremium && (
          <div className="flex items-center gap-2 text-yellow-600">
            <Crown className="h-5 w-5" />
            <span className="font-semibold">Premium</span>
          </div>
        )}
      </div>

      {!isPremium && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">Upgrade to Premium</h4>
            <ul className="space-y-2 text-sm text-gray-700 mb-4">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Unlimited AI prompts
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Advanced analytics
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Export entries as PDF
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Priority support
              </li>
            </ul>
            <Button variant="primary" onClick={handleUpgrade} className="w-full">
              Upgrade to Premium
            </Button>
          </div>
        </div>
      )}

      {isPremium && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-800">
          You&apos;re on the Premium plan. Thank you for your support!
          </p>
        </div>
      )}
    </div>
  );
}



