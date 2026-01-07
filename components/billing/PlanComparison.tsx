"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PlanComparison() {
  const handleUpgrade = () => {
    alert("Stripe checkout will be implemented when backend is ready");
  };

  const features = [
    { name: "AI Prompts", free: "10/month", premium: "Unlimited" },
    { name: "Journal Entries", free: "Unlimited", premium: "Unlimited" },
    { name: "Export to PDF", free: false, premium: true },
    { name: "Advanced Analytics", free: false, premium: true },
    { name: "Priority Support", free: false, premium: true },
    { name: "Dark Mode", free: false, premium: true },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Free Plan */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">Free</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">$0</p>
          <p className="text-sm text-gray-600 mt-1">Forever free</p>
        </div>
        <ul className="space-y-3 mb-6">
          {features.map((feature) => (
            <li key={feature.name} className="flex items-center gap-3">
              {typeof feature.free === "boolean" ? (
                feature.free ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-gray-400" />
                )
              ) : (
                <Check className="h-5 w-5 text-green-600" />
              )}
              <span className="text-sm text-gray-700">
                {feature.name}
                {typeof feature.free === "string" && (
                  <span className="text-gray-500 ml-1">({feature.free})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Premium Plan */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-300 p-6 relative">
        <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
          RECOMMENDED
        </div>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">Premium</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">$9.99</p>
          <p className="text-sm text-gray-600 mt-1">per month</p>
        </div>
        <ul className="space-y-3 mb-6">
          {features.map((feature) => (
            <li key={feature.name} className="flex items-center gap-3">
              {typeof feature.premium === "boolean" ? (
                feature.premium ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-gray-400" />
                )
              ) : (
                <Check className="h-5 w-5 text-green-600" />
              )}
              <span className="text-sm text-gray-700">
                {feature.name}
                {typeof feature.premium === "string" && (
                  <span className="text-gray-500 ml-1">({feature.premium})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <Button variant="primary" onClick={handleUpgrade} className="w-full">
          Upgrade to Premium
        </Button>
      </div>
    </div>
  );
}



