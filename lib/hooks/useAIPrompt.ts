import { useState, useCallback } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { createClient } from "@/lib/supabase/client";

interface AIPrompt {
  id: string;
  prompt_text: string;
  created_at: string;
}

// Call Supabase Edge Function to generate AI prompt
async function generateAIPrompt(content: string, entryId?: string): Promise<AIPrompt> {
  const supabase = createClient();
  
  // Get the current session to pass auth token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Not authenticated");
  }

  // Call the Edge Function
  const { data, error } = await supabase.functions.invoke('generate-prompts', {
    body: {
      content: content,
      entry_id: entryId, // Optional: only if entry is saved
    },
  });

  if (error) {
    console.error("Edge Function error:", error);
    throw new Error(error.message || "Failed to generate prompt");
  }

  if (!data || !data.prompt_text) {
    throw new Error("No prompt returned from API");
  }

  return {
    id: data.id || crypto.randomUUID(),
    prompt_text: data.prompt_text,
    created_at: data.created_at || new Date().toISOString(),
  };
}

export function useAIPrompt() {
  const { usage, subscriptionStatus } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const generatePrompt = useCallback(async (content: string, entryId?: string): Promise<AIPrompt | null> => {
    // Minimum content length to generate prompt
    if (content.trim().length < 50) {
      return null;
    }

    // Check usage limits (only for free tier)
    if (subscriptionStatus === "free" && usage.promptsUsed >= usage.promptsLimit) {
      setError("You've reached your monthly limit. Upgrade to Premium for unlimited prompts.");
      return null;
    }

    // Rate limiting: don't generate if generated in last 10 seconds
    if (lastGenerated && Date.now() - lastGenerated.getTime() < 10000) {
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const prompt = await generateAIPrompt(content, entryId);
      setLastGenerated(new Date());
      
      // Track usage (only for free tier)
      if (subscriptionStatus === "free") {
        const storedUsage = localStorage.getItem("ai_prompt_usage");
        const currentUsage = storedUsage ? JSON.parse(storedUsage) : { count: 0, month: new Date().getMonth() };
        
        // Reset if new month
        if (currentUsage.month !== new Date().getMonth()) {
          currentUsage.count = 0;
          currentUsage.month = new Date().getMonth();
        }
        
        currentUsage.count += 1;
        localStorage.setItem("ai_prompt_usage", JSON.stringify(currentUsage));
        
        // Update context (this is a simplified approach - in production, this would be handled by the backend)
        window.dispatchEvent(new CustomEvent("prompt-used"));
      }
      
      return prompt;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate prompt";
      setError(errorMessage);
      console.error("Error generating AI prompt:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [subscriptionStatus, usage, lastGenerated]);

  return {
    generatePrompt,
    isGenerating,
    error,
  };
}

