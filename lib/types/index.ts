export interface User {
  id: string;
  email: string;
  subscription_status: "free" | "premium";
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AIPrompt {
  id: string;
  entry_id: string;
  prompt_text: string;
  created_at: string;
}

