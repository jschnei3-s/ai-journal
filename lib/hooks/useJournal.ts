import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { JournalEntry } from "@/lib/types";

// Supabase database functions
async function fetchEntries(userId: string): Promise<JournalEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchEntry(id: string, userId: string): Promise<JournalEntry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows returned
    throw error;
  }
  return data;
}

async function createEntry(content: string, userId: string): Promise<JournalEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: userId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateEntry(id: string, content: string, userId: string): Promise<JournalEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .update({ content })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteEntry(id: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

// React Query hooks
export function useJournalEntries(userId: string | null) {
  return useQuery({
    queryKey: ["journal-entries", userId],
    queryFn: () => (userId ? fetchEntries(userId) : []),
    enabled: !!userId,
  });
}

export function useJournalEntry(id: string | null, userId: string | null) {
  return useQuery({
    queryKey: ["journal-entry", id, userId],
    queryFn: () => (id && userId ? fetchEntry(id, userId) : null),
    enabled: !!id && !!userId,
  });
}

export function useCreateEntry(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => {
      if (!userId) throw new Error("User not authenticated");
      return createEntry(content, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries", userId] });
    },
  });
}

export function useUpdateEntry(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => {
      if (!userId) throw new Error("User not authenticated");
      return updateEntry(id, content, userId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries", userId] });
      queryClient.invalidateQueries({ queryKey: ["journal-entry", data.id, userId] });
    },
  });
}

export function useDeleteEntry(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error("User not authenticated");
      return deleteEntry(id, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries", userId] });
    },
  });
}

