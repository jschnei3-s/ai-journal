"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useJournalEntry, useCreateEntry, useUpdateEntry, useDeleteEntry } from "@/lib/hooks/useJournal";
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
  }, [content, existingEntry]);

  const handleAutosave = async () => {
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
  };

  const handleManualSave = async () => {
    await handleAutosave();
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  // Auto-focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && !isLoadingEntry) {
      textareaRef.current.focus();
      // Move cursor to end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
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
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/entries")}
            aria-label="Back to entries"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {entryId ? "Edit Entry" : "New Entry"}
            </h1>
            {existingEntry && (
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(existingEntry.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            ) : (
              <span>Not saved</span>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving || !content.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your thoughts..."
          className="flex-1 w-full resize-none border-none outline-none text-gray-900 placeholder-gray-400 text-lg leading-relaxed bg-transparent"
          style={{ fontFamily: "inherit" }}
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
                textareaRef.current?.focus();
                const length = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(length, length);
              }, 100);
            }
          }}
        />
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {wordCount} {wordCount === 1 ? "word" : "words"} • {charCount}{" "}
          {charCount === 1 ? "character" : "characters"}
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
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteEntry.isPending ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}

