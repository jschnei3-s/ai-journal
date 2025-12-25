"use client";

import { useState, useMemo } from "react";
import { useJournalEntries, useDeleteEntry } from "@/lib/hooks/useJournal";
import { useAuth } from "@/contexts/AuthContext";
import { EntryCard } from "./EntryCard";
import { Button } from "@/components/ui/Button";
import { Search, Plus, Loader2 } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-600 mt-1">
            {filteredEntries.length}{" "}
            {filteredEntries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <Link href="/journal/new">
          <Button variant="primary">
            <Plus className="h-5 w-5 mr-2" />
            New Entry
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Entries */}
      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">
            {searchQuery
              ? "No entries match your search."
              : "No journal entries yet."}
          </p>
          {!searchQuery && (
            <Link href="/journal/new">
              <Button variant="primary">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Entry
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => {
            const dateEntries = groupedEntries[date];
            const displayDate = format(new Date(date), "EEEE, MMMM d, yyyy");

            return (
              <div key={date}>
                <h2 className="text-lg font-semibold text-gray-700 mb-4 sticky top-0 bg-gray-50 py-2 z-10">
                  {displayDate}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

