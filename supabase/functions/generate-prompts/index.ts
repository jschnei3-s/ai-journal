// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!
const SUPABASE_URL = Deno.env.get("PROJECT_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!

if (!OPENAI_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
}

type GeneratePromptsRequest = {
  entry_id: string
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      })
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      )
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const body = (await req.json()) as Partial<GeneratePromptsRequest>
    const entryId = body.entry_id

    if (!entryId) {
      return new Response(
        JSON.stringify({ error: "entry_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch journal entry
    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single()

    if (entryError || !entry) {
      return new Response(
        JSON.stringify({ error: "Entry not found or not owned by user" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      )
    }

    const content: string = entry.content

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
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a supportive journaling companion. Ask thoughtful, open-ended follow-up questions that help the user reflect more deeply on what they wrote. Do not give advice, diagnoses, or instructions. Respond ONLY with a numbered list of 3 to 5 short questions.",
            },
            {
              role: "user",
              content: `Here is the user's journal entry:\n\n${content}\n\nGenerate 3–5 follow-up questions.`,
            },
          ],
          temperature: 0.7,
        }),
      },
    )

    if (!openaiRes.ok) {
      const text = await openaiRes.text()
      console.error("OpenAI error:", text)
      return new Response(
        JSON.stringify({ error: "Failed to generate prompts" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    const openaiJson = await openaiRes.json()
    const rawText: string =
      openaiJson.choices?.[0]?.message?.content ?? ""

    const prompts = rawText
      .split("\n")
      .map((line: string) => line.replace(/^\d+[\).\s]*/, "").trim())
      .filter((line: string) => line.length > 0)

    if (prompts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No prompts generated" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    const rows = prompts.map((p: string) => ({
      entry_id: entryId,
      prompt_text: p,
    }))

    const { error: insertError } = await supabase
      .from("ai_prompts")
      .insert(rows)

    if (insertError) {
      console.error("DB insert error:", insertError)
      return new Response(
        JSON.stringify({ error: "Failed to save prompts" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    return new Response(JSON.stringify({ prompts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error(e)
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-prompts' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
