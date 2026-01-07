"use client";

import { Button } from "@/components/ui/Button";
import { Check, Crown } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

export function SubscriptionCard() {
  const { subscriptionStatus } = useSubscription();
  const isPremium = subscriptionStatus === "premium";

    const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // body is optional because we use STRIPE_PRICE_ID_PREMIUM from env
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        console.error("Failed to create checkout session", await res.text());
        alert("Failed to start checkout. Please try again.");
        return;
      }

      const data = await res.json();

      if (!data.url) {
        alert("Stripe did not return a checkout URL.");
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("Error calling checkout endpoint:", err);
      alert("Something went wrong starting checkout.");
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



