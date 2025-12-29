"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { User as AppUser } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      // In frontend-only mode, create a mock user
      setUser({
        id: 'dev-user',
        email: 'dev@example.com',
      } as any);
      setAppUser({
        id: 'dev-user',
        email: 'dev@example.com',
        subscription_status: 'free',
        created_at: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If table doesn't exist, show helpful error
        if (error.code === "PGRST205") {
          console.error("Database schema not set up. Please run supabase-schema.sql in your Supabase SQL Editor.");
          // Fallback: create a basic user object from auth user
          if (user) {
            setAppUser({
              id: user.id,
              email: user.email || "",
              subscription_status: "free",
              created_at: new Date().toISOString(),
            });
          }
          return;
        }
        
        // If user doesn't exist in users table yet, create it
        if (error.code === "PGRST116") {
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
              id: userId,
              email: user?.email || "",
              subscription_status: "free",
            })
            .select()
            .single();

          if (insertError) {
            // If insert fails due to RLS, the user needs to run the fix script
            console.error("Failed to create user profile. This might be due to RLS policies.", insertError);
            console.error("Please run fix-user-profile.sql in your Supabase SQL Editor.");
            // Fallback: create a basic user object from auth user
            if (user) {
              setAppUser({
                id: user.id,
                email: user.email || "",
                subscription_status: "free",
                created_at: new Date().toISOString(),
              });
            }
            return;
          }
          setAppUser(newUser as AppUser);
        } else {
          throw error;
        }
      } else {
        setAppUser(data as AppUser);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback: create a basic user object from auth user
      if (user) {
        setAppUser({
          id: user.id,
          email: user.email || "",
          subscription_status: "free",
          created_at: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setAppUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

