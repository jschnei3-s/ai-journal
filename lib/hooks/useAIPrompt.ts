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
  
  // Get the current session
  let { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
  
  // If no session or token is missing, try to refresh
  if (sessionError || !currentSession?.access_token) {
    console.log("Session invalid, attempting refresh...");
    const refreshResult = await supabase.auth.refreshSession();
    if (refreshResult.data?.session?.access_token) {
      currentSession = refreshResult.data.session;
    } else {
      console.error("Session error:", sessionError || refreshResult.error);
      throw new Error("No valid session. Please sign out and sign back in.");
    }
  }
  
  // Verify token is not expired
  if (currentSession.expires_at && currentSession.expires_at * 1000 < Date.now()) {
    console.log("Token expired, refreshing...");
    const refreshResult = await supabase.auth.refreshSession();
    if (refreshResult.data?.session?.access_token) {
      currentSession = refreshResult.data.session;
    } else {
      throw new Error("Session expired. Please sign out and sign back in.");
    }
  }
  
  if (!currentSession?.access_token) {
    throw new Error("No valid session. Please sign out and sign back in.");
  }
  
  console.log("Using token, expires at:", currentSession.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : "unknown");

  // Call the Edge Function directly using fetch with explicit auth headers
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    throw new Error("Supabase URL not configured");
  }

  console.log("Calling Edge Function with token:", currentSession.access_token.substring(0, 20) + "...");

  // Use Supabase's built-in function invocation which handles auth automatically
  const { data, error: invokeError } = await supabase.functions.invoke('generate-prompts', {
    body: {
      content: content,
      entry_id: entryId,
    },
  });

  // If invoke worked, return the data directly
  if (data && !invokeError) {
    console.log("✅ Supabase invoke succeeded, data:", {
      hasError: !!data.error,
      hasPromptText: !!data.prompt_text,
      promptTextLength: data.prompt_text?.length || 0,
      dataKeys: Object.keys(data),
    });
    
    if (data.error) {
      console.error("Data contains error:", data.error);
      throw new Error(data.error);
    }

    if (!data.prompt_text) {
      console.error("Data missing prompt_text:", data);
      throw new Error("No prompt returned from API");
    }

    console.log("✅ Successfully parsed prompt from invoke, returning to component");
    return {
      id: data.id || crypto.randomUUID(),
      prompt_text: data.prompt_text,
      created_at: data.created_at || new Date().toISOString(),
    };
  }

  // If invoke failed, log the error and try direct fetch as fallback
  if (invokeError) {
    console.warn("Supabase invoke failed:", invokeError);
    // Try to extract error message from the invoke error
    if (invokeError.message) {
      console.warn("Error message:", invokeError.message);
    }
    if (invokeError.context) {
      console.warn("Error context:", invokeError.context);
    }
    // If it's an auth error, throw it directly instead of trying fetch
    if (invokeError.message?.includes("401") || invokeError.message?.includes("Unauthorized") || invokeError.message?.includes("JWT")) {
      throw new Error(invokeError.message || "Authentication failed. Please sign out and sign back in.");
    }
  }

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/generate-prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentSession.access_token}`,
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    body: JSON.stringify({
      content: content,
      entry_id: entryId,
    }),
      signal: controller.signal,
  });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      throw new Error("Request timed out. Please try again.");
    }
    throw fetchError;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: `Status ${response.status}: ${errorText}` };
    }
    
    console.error("Edge Function error response:", errorData);
    throw new Error(errorData.error || errorData.details || errorData.message || `Edge Function error: ${response.status}`);
  }

  const responseData = await response.json();
  console.log("✅ Edge Function response received:", {
    hasError: !!responseData.error,
    hasPromptText: !!responseData.prompt_text,
    promptTextLength: responseData.prompt_text?.length || 0,
    responseKeys: Object.keys(responseData),
  });
  
  if (responseData.error) {
    console.error("Response contains error:", responseData.error);
    throw new Error(responseData.error);
  }

  if (!responseData.prompt_text) {
    console.error("Response missing prompt_text:", responseData);
    throw new Error("No prompt returned from API");
  }

  console.log("✅ Successfully parsed prompt, returning to component");
  return {
    id: responseData.id || crypto.randomUUID(),
    prompt_text: responseData.prompt_text,
    created_at: responseData.created_at || new Date().toISOString(),
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
      let errorMessage = "Failed to generate prompt";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object') {
        // Try to extract message from error object
        if ('message' in err) {
          errorMessage = String(err.message);
        } else if ('error' in err) {
          errorMessage = String(err.error);
        } else {
          errorMessage = JSON.stringify(err);
        }
      } else {
        errorMessage = String(err);
      }
      
      setError(errorMessage);
      console.error("Error generating AI prompt:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [subscriptionStatus, usage, lastGenerated]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generatePrompt,
    isGenerating,
    error,
    clearError,
  };
}
