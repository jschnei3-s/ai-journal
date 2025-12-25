import { SubscriptionCard } from "@/components/billing/SubscriptionCard";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function BillingPage() {
  const { usage, subscriptionStatus } = useSubscription();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and view usage limits
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <SubscriptionCard />
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage</h3>
          <UsageMeter
            current={usage.promptsUsed}
            limit={usage.promptsLimit}
            label="AI Prompts This Month"
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Comparison</h2>
        <PlanComparison />
      </div>
    </div>
  );
}

