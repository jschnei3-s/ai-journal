"use client";

import { useState, useEffect } from "react";
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
  const { generatePrompt, isGenerating, error } = useAIPrompt();
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Generate prompt when content changes (debounced)
  useEffect(() => {
    if (dismissed || !content.trim() || content.length < 50) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      const prompt = await generatePrompt(content);
      if (prompt) {
        setCurrentPrompt(prompt.prompt_text);
        setIsVisible(true);
        setDismissed(false);
      }
    }, 2000); // Wait 2 seconds after typing stops

    return () => clearTimeout(timeoutId);
  }, [content, generatePrompt, dismissed]);

  const handleAccept = () => {
    if (currentPrompt && onPromptAccepted) {
      onPromptAccepted(currentPrompt);
    }
    setIsVisible(false);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
  };

  if (!isVisible && !isGenerating && !error) {
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
            {error ? (
              <p className="text-sm text-red-600 mb-3">{error}</p>
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

