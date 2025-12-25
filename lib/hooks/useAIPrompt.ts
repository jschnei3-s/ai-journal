import { useState, useCallback } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface AIPrompt {
  id: string;
  prompt_text: string;
  created_at: string;
}

// Mock AI prompt generation - will be replaced with Edge Function call
async function generateAIPrompt(content: string): Promise<AIPrompt> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock prompt generation based on content
  // In production, this will call a Supabase Edge Function
  const prompts = [
    "What emotions are you experiencing as you write this?",
    "Can you explore this thought from a different perspective?",
    "What would you tell a friend who was going through this?",
    "What patterns do you notice in your thinking?",
    "How does this situation relate to your values?",
    "What would you like to understand better about this?",
    "What feels most important about what you've written?",
    "How might you approach this differently?",
  ];

  // Simple content analysis to pick relevant prompt
  const contentLower = content.toLowerCase();
  let selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  // Context-aware prompt selection (basic)
  if (contentLower.includes("stress") || contentLower.includes("anxious")) {
    selectedPrompt = "What specific aspects of this situation are causing you stress?";
  } else if (contentLower.includes("happy") || contentLower.includes("excited")) {
    selectedPrompt = "What made this moment special? How can you create more of these moments?";
  } else if (contentLower.includes("sad") || contentLower.includes("disappointed")) {
    selectedPrompt = "What support do you need right now? How can you be kind to yourself?";
  } else if (contentLower.includes("work") || contentLower.includes("job")) {
    selectedPrompt = "How does this work situation align with your personal goals?";
  } else if (contentLower.includes("relationship") || contentLower.includes("friend")) {
    selectedPrompt = "What does this relationship mean to you? What do you value about it?";
  }

  return {
    id: crypto.randomUUID(),
    prompt_text: selectedPrompt,
    created_at: new Date().toISOString(),
  };
}

export function useAIPrompt() {
  const { usage, subscriptionStatus } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const generatePrompt = useCallback(async (content: string): Promise<AIPrompt | null> => {
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
      const prompt = await generateAIPrompt(content);
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
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [lastGenerated]);

  return {
    generatePrompt,
    isGenerating,
    error,
  };
}

