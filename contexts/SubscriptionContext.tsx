"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { createClient } from "@/lib/supabase/client";

interface SubscriptionContextType {
  subscriptionStatus: "free" | "premium";
  usage: {
    promptsUsed: number;
    promptsLimit: number;
  };
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<"free" | "premium">("free");
  const [usage, setUsage] = useState({ promptsUsed: 0, promptsLimit: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appUser) {
      setSubscriptionStatus(appUser.subscription_status || "free");
      fetchUsage(appUser.id);
    } else {
      setLoading(false);
    }
  }, [appUser]);

  async function fetchUsage(userId: string) {
    try {
      const supabase = createClient();
      // Count AI prompts used this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from("ai_prompts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      if (error) throw error;

      const promptsUsed = count || 0;
      const currentStatus = subscriptionStatus || appUser?.subscription_status || "free";
      const promptsLimit = currentStatus === "premium" ? 999999 : 10;

      setUsage({ promptsUsed, promptsLimit });
    } catch (error) {
      console.error("Error fetching usage:", error);
      // Fallback to default
      const currentStatus = subscriptionStatus || appUser?.subscription_status || "free";
      setUsage({
        promptsUsed: 0,
        promptsLimit: currentStatus === "premium" ? 999999 : 10,
      });
    } finally {
      setLoading(false);
    }
  }

  // Update limits based on subscription
  useEffect(() => {
    if (subscriptionStatus === "premium") {
      setUsage((prev) => ({ ...prev, promptsLimit: 999999 }));
    } else {
      setUsage((prev) => ({ ...prev, promptsLimit: 10 }));
    }
  }, [subscriptionStatus]);

  return (
    <SubscriptionContext.Provider
      value={{ subscriptionStatus, usage, loading }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}

