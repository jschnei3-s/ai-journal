// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

if (!OPENAI_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
}

type GeneratePromptsRequest = {
  content?: string;  // Accept content directly (for real-time prompts)
  entry_id?: string; // Optional: if provided, will fetch from DB and save prompts
};

serve(async (req: Request) => {
  try {
    // 1) Handle CORS preflight FIRST
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: {
          ...corsHeaders,
        },
      });
    }

    // 2) Only allow POST for real work (no 405 for OPTIONS)
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user first (required for both paths)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = (await req.json()) as Partial<GeneratePromptsRequest>;
    const entryId = body.entry_id;
    let content: string;

    // Get content either directly or from database
    if (body.content) {
      // Content provided directly (for real-time prompts while typing)
      content = body.content.trim();

      // Minimum content length check
      if (content.length < 50) {
        return new Response(
          JSON.stringify({
            error: "Content too short. Need at least 50 characters.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } else if (entryId) {
      // Fetch journal entry from database
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .eq("user_id", user.id)
        .single();

      if (entryError || !entry) {
        return new Response(
          JSON.stringify({
            error: "Entry not found or not owned by user",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      content = entry.content;
    } else {
      return new Response(
        JSON.stringify({
          error: "Either 'content' or 'entry_id' is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Call OpenAI
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a supportive journaling companion. Generate a single thoughtful, open-ended follow-up question that helps the user reflect more deeply on what they wrote. Do not give advice, diagnoses, or instructions. Respond with ONLY the question, nothing else. No numbering, no list, just the question.",
            },
            {
              role: "user",
              content: `Here is the user's journal entry:\n\n${content}\n\nGenerate one thoughtful follow-up question.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      },
    );

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      console.error("OpenAI error:", text);
      return new Response(
        JSON.stringify({ error: "Failed to generate prompts" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const openaiJson = await openaiRes.json();
    const promptText: string =
      openaiJson.choices?.[0]?.message?.content?.trim() ?? "";

    // Clean up the prompt (remove numbering, extra whitespace, etc.)
    const cleanPrompt = promptText
      .replace(/^\d+[\).\s]*/, "") // Remove leading numbers
      .replace(/^[-\*]\s*/, "") // Remove bullet points
      .trim();

    if (!cleanPrompt) {
      return new Response(
        JSON.stringify({ error: "No prompt generated" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Only save to database if entry_id is provided
    if (entryId) {
      const { error: insertError } = await supabase
        .from("ai_prompts")
        .insert({
          entry_id: entryId,
          prompt_text: cleanPrompt,
        });

      if (insertError) {
        console.error("DB insert error:", insertError);
        // Don't fail the request if DB insert fails, just log it
      }
    }

    // Return single prompt (matching what the UI expects)
    return new Response(
      JSON.stringify({
        prompt_text: cleanPrompt,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-prompts' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
