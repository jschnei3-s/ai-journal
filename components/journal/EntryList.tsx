"use client";

import { useState, useMemo } from "react";
import { useJournalEntries, useDeleteEntry } from "@/lib/hooks/useJournal";
import { useAuth } from "@/contexts/AuthContext";
import { EntryCard } from "./EntryCard";
import { Button } from "@/components/ui/Button";
import { Search, Plus, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export function EntryList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const userId = user?.id || null;
  const { data: entries, isLoading, error } = useJournalEntries(userId);
  const deleteEntry = useDeleteEntry(userId);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (!searchQuery.trim()) return entries;

    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.content.toLowerCase().includes(query) ||
        new Date(entry.created_at).toLocaleDateString().includes(query)
    );
  }, [entries, searchQuery]);

  const groupedEntries = useMemo(() => {
    if (!filteredEntries.length) return {};

    const grouped: Record<string, typeof filteredEntries> = {};
    filteredEntries.forEach((entry) => {
      const date = format(new Date(entry.created_at), "yyyy-MM-dd");
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });
    return grouped;
  }, [filteredEntries]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
      try {
        await deleteEntry.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting entry:", error);
        alert("Failed to delete entry. Please try again.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading entries. Please try again.</p>
      </div>
    );
  }

  const sortedDates = Object.keys(groupedEntries).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-900 bg-clip-text text-transparent">
            Journal Entries
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            {filteredEntries.length}{" "}
            {filteredEntries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <Link href="/journal/new">
          <Button variant="primary" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="h-5 w-5 mr-2" />
            New Entry
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Entries */}
      {sortedDates.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200/60 p-16 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <FileText className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-gray-700 text-xl font-medium mb-2">
              {searchQuery
                ? "No entries match your search."
                : "No journal entries yet."}
            </p>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "Try a different search term."
                : "Start your journey of self-reflection and growth."}
            </p>
            {!searchQuery && (
              <Link href="/journal/new">
                <Button variant="primary" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Entry
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedDates.map((date) => {
            const dateEntries = groupedEntries[date];
            const displayDate = format(new Date(date), "EEEE, MMMM d, yyyy");

            return (
              <div key={date} className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800 mb-6 sticky top-4 bg-gradient-to-r from-gray-50 to-indigo-50/30 backdrop-blur-sm py-3 px-4 rounded-lg border border-gray-200/60 z-10 shadow-sm">
                  {displayDate}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {dateEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

