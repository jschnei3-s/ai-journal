"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Sparkles, X, Loader2 } from "lucide-react";
import { useAIPrompt } from "@/lib/hooks/useAIPrompt";

interface AIPromptDisplayProps {
  content: string;
  entryId?: string;
  onPromptAccepted?: (prompt: string) => void;
}

export function AIPromptDisplay({
  content,
  entryId,
  onPromptAccepted,
}: AIPromptDisplayProps) {
  const { generatePrompt, isGenerating, error, clearError } = useAIPrompt();
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastProcessedContentRef = useRef<string>("");
  const isProcessingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const acceptedPromptRef = useRef<string | null>(null);
  const originalContentRef = useRef<string>("");
  const dismissedRef = useRef<boolean>(false);

  // Sync ref with state to avoid dependency issues
  useEffect(() => {
    dismissedRef.current = dismissed;
  }, [dismissed]);

  // Generate prompt when content changes (debounced)
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const trimmedContent = content.trim();
    
    // Don't generate if:
    // - Content is too short
    // - Already processing
    // - Already dismissed for this exact content
    // - Content hasn't changed since last processing
    // - We just accepted a prompt (content might include the prompt now)
    if (
      !trimmedContent ||
      trimmedContent.length < 50 ||
      isProcessingRef.current ||
      dismissedRef.current ||
      trimmedContent === lastProcessedContentRef.current ||
      acceptedPromptRef.current !== null
    ) {
      return;
    }

    // Debounce: wait 2 seconds after typing stops
    timeoutRef.current = setTimeout(async () => {
      // Triple-check conditions before processing
      const currentTrimmed = content.trim();
      if (
        currentTrimmed === lastProcessedContentRef.current || 
        isProcessingRef.current ||
        dismissedRef.current ||
        acceptedPromptRef.current !== null
      ) {
        return;
      }

      isProcessingRef.current = true;
      originalContentRef.current = currentTrimmed;
      
      try {
        const prompt = await generatePrompt(currentTrimmed, entryId);
        
        // Check if content is still the same (user hasn't typed more)
        const stillCurrent = content.trim() === currentTrimmed;
        
        if (prompt && prompt.prompt_text && stillCurrent && currentTrimmed === originalContentRef.current) {
          // Success! Clear any previous errors and show the prompt
          console.log("✅ Prompt generated successfully:", prompt.prompt_text.substring(0, 50) + "...");
          
          // Use a function update to avoid dependency issues
          setCurrentPrompt(prompt.prompt_text);
          setIsVisible(true);
          lastProcessedContentRef.current = currentTrimmed;
          
          // Clear error and reset dismissed in a batch to minimize re-renders
          clearError();
          if (dismissedRef.current) {
            setDismissed(false);
          }
        } else if (!prompt && stillCurrent) {
          // If no prompt returned, mark as processed to prevent immediate retry
          console.log("⚠️ No prompt returned");
          lastProcessedContentRef.current = currentTrimmed;
        } else if (!stillCurrent) {
          // Content changed while generating, ignore this result
          console.log("⚠️ Content changed while generating, ignoring result");
        }
      } catch (err) {
        // Error is handled by useAIPrompt hook
        console.error("❌ Error generating prompt:", err);
        
        // Only mark as processed if content hasn't changed
        if (content.trim() === currentTrimmed) {
          lastProcessedContentRef.current = currentTrimmed;
          
          // If it's a rate limit or quota error, mark as dismissed to prevent immediate retry
          if (err instanceof Error && (
            err.message.toLowerCase().includes("rate") || 
            err.message.toLowerCase().includes("quota") || 
            err.message.toLowerCase().includes("credits") ||
            err.message.includes("429")
          )) {
            setDismissed(true);
          }
        }
        // Don't set error state here - useAIPrompt hook handles it
      } finally {
        isProcessingRef.current = false;
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [content, entryId, generatePrompt, clearError]);

  const handleAccept = () => {
    if (currentPrompt && onPromptAccepted) {
      // Mark that we accepted a prompt to prevent re-processing
      acceptedPromptRef.current = currentPrompt;
      setIsVisible(false);
      setDismissed(true);
      lastProcessedContentRef.current = content.trim();
      
      // Call the callback
      onPromptAccepted(currentPrompt);
      
      // Clear the accepted prompt ref after a delay to allow new prompts for significantly different content
      setTimeout(() => {
        acceptedPromptRef.current = null;
      }, 1000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    lastProcessedContentRef.current = content.trim();
    acceptedPromptRef.current = null;
    clearError(); // Clear error when dismissed
  };

  // Reset dismissed state when content changes significantly (user is typing new content)
  // But only if we haven't just accepted a prompt
  useEffect(() => {
    if (acceptedPromptRef.current !== null) {
      return; // Don't reset if we just accepted a prompt
    }

    const trimmedContent = content.trim();
    const contentChangedSignificantly = 
      trimmedContent.length >= 50 && 
      trimmedContent !== lastProcessedContentRef.current &&
      lastProcessedContentRef.current.length > 0; // Don't reset on initial load
    
    if (contentChangedSignificantly && dismissed) {
      // User is typing new content after dismissing, allow new prompt
      setDismissed(false);
      setIsVisible(false);
      setCurrentPrompt(null);
      clearError(); // Clear any errors when user starts typing new content
    }
  }, [content, dismissed, clearError]);

  // Clear error state when content changes significantly to prevent stale errors
  // Only clear if we have an error AND content has changed significantly
  useEffect(() => {
    if (!error) return; // Early return if no error
    
    const trimmedContent = content.trim();
    const contentChanged = trimmedContent !== lastProcessedContentRef.current && 
                          trimmedContent.length >= 50 &&
                          lastProcessedContentRef.current.length > 0;
    
    if (contentChanged) {
      // Clear error when user types significantly new content
      clearError();
      // Don't reset dismissed here to avoid loops
    }
  }, [content, error, clearError]);

  // Don't show error if we're already dismissed or processing or if we have a prompt
  // This prevents error display from causing re-renders
  const shouldShowError = error && !isProcessingRef.current && !dismissed && !currentPrompt;

  // Only show if visible, generating, or there's an error to display
  // IMPORTANT: This early return must come AFTER all hooks
  if (!isVisible && !isGenerating && !shouldShowError) {
    return null;
  }

  return (
    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {isGenerating ? (
              <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5 text-purple-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-purple-900">
                Reflection Prompt
              </span>
              {isGenerating && (
                <span className="text-xs text-purple-600">Generating...</span>
              )}
            </div>
            {shouldShowError ? (
              <div className="mb-3">
                <p className="text-sm text-red-600 mb-2">{error}</p>
                {error?.toLowerCase().includes("quota") || error?.toLowerCase().includes("credits") ? (
                  <p className="text-xs text-gray-500 mb-2">
                    Your OpenAI account has no credits. Add credits or a payment method at{" "}
                    <a 
                      href="https://platform.openai.com/account/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      platform.openai.com/account/billing
                    </a>
                  </p>
                ) : error?.toLowerCase().includes("rate") ? (
                  <p className="text-xs text-gray-500 mb-2">
                    Wait a minute and try again, or add payment to your OpenAI account for higher limits.
                  </p>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-gray-600 text-xs"
                >
                  Dismiss
                </Button>
              </div>
            ) : currentPrompt ? (
              <p className="text-sm text-gray-800 mb-3 leading-relaxed">
                {currentPrompt}
              </p>
            ) : null}
            {currentPrompt && !error && (
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAccept}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Use This Prompt
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

