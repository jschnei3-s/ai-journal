"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useJournalEntry, useCreateEntry, useUpdateEntry, useDeleteEntry } from "@/lib/hooks/useJournal";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Save, Trash2, ArrowLeft } from "lucide-react";
import { AIPromptDisplay } from "./AIPromptDisplay";

interface JournalEditorProps {
  entryId?: string;
}

export function JournalEditor({ entryId }: JournalEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const userId = user?.id || null;
  
  const { data: existingEntry, isLoading: isLoadingEntry } = useJournalEntry(
    entryId || null,
    userId
  );
  const createEntry = useCreateEntry(userId);
  const updateEntry = useUpdateEntry(userId);
  const deleteEntry = useDeleteEntry(userId);

  // Load existing entry content
  useEffect(() => {
    if (existingEntry) {
      setContent(existingEntry.content);
    }
  }, [existingEntry]);

  const handleAutosave = useCallback(async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      if (entryId && existingEntry) {
        await updateEntry.mutateAsync({ id: entryId, content });
      } else {
        const newEntry = await createEntry.mutateAsync(content);
        // Redirect to edit page for the new entry
        if (newEntry) {
          router.replace(`/journal/${newEntry.id}`);
        }
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [content, entryId, existingEntry, updateEntry, createEntry, router]);

  // Autosave functionality
  useEffect(() => {
    // Don't autosave if content is empty or hasn't changed
    if (!content.trim() || (existingEntry && content === existingEntry.content)) {
      return;
    }

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout for autosave (2 seconds after typing stops)
    autosaveTimeoutRef.current = setTimeout(() => {
      handleAutosave();
    }, 2000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [content, existingEntry, handleAutosave]);

  const handleManualSave = async () => {
    await handleAutosave();
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  // Auto-focus textarea on mount
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || isLoadingEntry) return;
  
    el.focus();
    const length = el.value.length;
    el.setSelectionRange(length, length);
  }, [isLoadingEntry]);  

  if (isLoadingEntry && entryId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-200/60">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/entries")}
            aria-label="Back to entries"
            className="hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-900 bg-clip-text text-transparent">
              {entryId ? "Edit Entry" : "New Entry"}
            </h1>
            {existingEntry && (
              <p className="text-sm text-gray-600 mt-1.5">
                Created {new Date(existingEntry.created_at).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200/60">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin text-indigo-600">⏳</span>
                <span className="font-medium">Saving...</span>
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-2 text-indigo-700">
                <Save className="h-4 w-4" />
                <span className="font-medium">Saved {lastSaved.toLocaleTimeString()}</span>
              </span>
            ) : (
              <span className="text-gray-500">Not saved</span>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving || !content.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your thoughts... Let your mind flow freely."
          className="flex-1 w-full resize-none border-none outline-none text-gray-900 placeholder-gray-400 text-lg leading-relaxed bg-transparent focus:ring-0"
          style={{ 
            fontFamily: "inherit",
            lineHeight: "1.8",
            fontSize: "17px"
          }}
        />
        <AIPromptDisplay
          content={content}
          entryId={entryId}
          onPromptAccepted={(prompt) => {
            // Append prompt as a question in the editor
            setContent((prev) => {
              const newContent = prev.trim() + "\n\n" + prompt + "\n\n";
              return newContent;
            });
            // Focus back on textarea
            if (textareaRef.current) {
                setTimeout(() => {
                    const el = textareaRef.current;
                    if (!el) return;
                  
                    el.focus();
                    const length = el.value.length;
                    el.setSelectionRange(length, length);
                  }, 100);
                  
            }
          }}
        />
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200/60 inline-flex items-center gap-2">
          <span className="font-semibold text-gray-900">{wordCount}</span>
          <span>{wordCount === 1 ? "word" : "words"}</span>
          <span className="text-gray-400">•</span>
          <span className="font-semibold text-gray-900">{charCount}</span>
          <span>{charCount === 1 ? "character" : "characters"}</span>
        </div>
        {entryId && existingEntry && (
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              if (confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
                try {
                  await deleteEntry.mutateAsync(entryId);
                  router.push("/entries");
                } catch (error) {
                  console.error("Error deleting entry:", error);
                  alert("Failed to delete entry. Please try again.");
                }
              }
            }}
            disabled={deleteEntry.isPending}
            className="hover:scale-105 transition-transform"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteEntry.isPending ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}

