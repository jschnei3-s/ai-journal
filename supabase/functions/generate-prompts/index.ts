// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
// Get anon key from environment or extract from request
// The anon key is needed to validate user JWTs properly
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("ANON_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Validate environment variables at startup
if (!OPENAI_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables:", {
    hasOpenAIKey: !!OPENAI_API_KEY,
    hasSupabaseUrl: !!SUPABASE_URL,
    hasServiceRoleKey: !!SERVICE_ROLE_KEY,
    hasAnonKey: !!ANON_KEY,
  });
}

type GeneratePromptsRequest = {
  content?: string;  // Accept content directly (for real-time prompts)
  entry_id?: string; // Optional: if provided, will fetch from DB and save prompts
};

serve(async (req: Request) => {
  // Log every request for debugging
  console.log("=== Edge Function Called ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Timestamp:", new Date().toISOString());
  
  try {
    // 1) Handle CORS preflight FIRST
    if (req.method === "OPTIONS") {
      console.log("Handling OPTIONS preflight");
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

    // Manual JWT validation (verify_jwt = false)
    // Get authorization header to extract the token
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ Missing Authorization header!");
      return new Response(
        JSON.stringify({ 
          error: "Missing Authorization header",
          details: "Please sign in to use this feature"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    
    // Extract the token
    const token = authHeader.replace("Bearer ", "").trim();
    console.log("Token extracted, length:", token.length);
    
    // Use service role key to validate and get user from the token
    // The service role key can validate any JWT token
    console.log("Validating JWT token with service role key...");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    // Get user from the token - this validates the JWT and extracts user info
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("❌ JWT validation failed!");
      console.error("UserError:", JSON.stringify(userError, null, 2));
      console.error("User:", user);
      console.error("Token preview:", token.substring(0, 50) + "...");
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid JWT",
          details: userError?.message || "User authentication failed",
          hint: "Please sign out and sign back in to refresh your session.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    
    console.log("✅ User authenticated:", user.id);

    console.log("Parsing request body...");
    let body: Partial<GeneratePromptsRequest>;
    try {
      body = (await req.json()) as Partial<GeneratePromptsRequest>;
      console.log("Request body received:", { 
        hasContent: !!body.content, 
        contentLength: body.content?.length || 0,
        hasEntryId: !!body.entry_id 
      });
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body",
          details: parseError instanceof Error ? parseError.message : String(parseError)
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    
    console.log("Extracting content from request...");
    const entryId = body.entry_id;
    let content: string;

    // Get content either directly or from database
    if (body.content) {
      console.log("Using content from request body");
      // Content provided directly (for real-time prompts while typing)
      content = body.content.trim();

      // Minimum content length check
      if (content.length < 50) {
        console.log("Content too short:", content.length);
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
      console.log("Content extracted successfully, length:", content.length);
    } else if (entryId) {
      console.log("Fetching content from database for entry:", entryId);
      // Fetch journal entry from database
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .eq("user_id", user.id)
        .single();

      if (entryError || !entry) {
        console.error("❌ Failed to fetch entry:", entryError);
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
      console.log("Content fetched from database, length:", content.length);
    } else {
      console.error("❌ No content or entry_id provided");
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

    console.log("Validating OpenAI API key...");
    // Validate OpenAI API key is set
    if (!OPENAI_API_KEY || OPENAI_API_KEY === "" || OPENAI_API_KEY.includes("placeholder")) {
      console.error("❌ OPENAI_API_KEY is not set or is invalid!");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error",
          details: "OpenAI API key is not configured. Please set OPENAI_API_KEY in Edge Function secrets."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    
    // Basic validation of API key format
    if (!OPENAI_API_KEY.startsWith("sk-")) {
      console.error("❌ OPENAI_API_KEY format is invalid (should start with 'sk-')!");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error",
          details: "Invalid OpenAI API key format. Please check your OPENAI_API_KEY in Edge Function secrets."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    
    console.log("✅ OpenAI API key format validated");
    console.log("API key preview:", OPENAI_API_KEY.substring(0, 7) + "...");

    console.log("Calling OpenAI API with model: gpt-3.5-turbo");
    console.log("Content length:", content.length);
    console.log("Content preview:", content.substring(0, 100) + "...");
    console.log("OPENAI_API_KEY exists:", !!OPENAI_API_KEY);
    console.log("OPENAI_API_KEY starts with 'sk-':", OPENAI_API_KEY?.startsWith("sk-"));
    console.log("OPENAI_API_KEY length:", OPENAI_API_KEY?.length || 0);
    
    // Call OpenAI
    const openaiRequestStart = Date.now();
    console.log("Making OpenAI API request at:", new Date().toISOString());
    
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
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
    
    const openaiRequestDuration = Date.now() - openaiRequestStart;
    console.log(`OpenAI API request completed in ${openaiRequestDuration}ms`);
    console.log("OpenAI response status:", openaiRes.status);

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("OpenAI API error!");
      console.error("Status:", openaiRes.status);
      console.error("Status text:", openaiRes.statusText);
      console.error("Response:", errorText);
      
      let errorMessage = "Failed to generate prompts";
      let userFriendlyMessage = errorMessage;
      let isQuotaError = false;
      let isRateLimitError = false;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage;
        
        // Check error code first to determine the type
        const errorCode = errorJson.error?.code;
        
        // Handle quota exceeded errors FIRST (these take precedence)
        if (errorCode === "insufficient_quota") {
          isQuotaError = true;
          userFriendlyMessage = "OpenAI account has no credits. Please add credits or a payment method to your OpenAI account to continue using AI prompts.";
          console.error("❌ OpenAI account has no credits/quota!");
          console.error("This usually means:");
          console.error("  1. The OpenAI account never had credits added");
          console.error("  2. Free tier credits were already used");
          console.error("  3. Credits expired or were consumed elsewhere");
          console.error("Solution: Add credits at https://platform.openai.com/account/billing");
        }
        // Handle rate limit errors (different from quota)
        else if (openaiRes.status === 429 || errorCode === "rate_limit_exceeded") {
          isRateLimitError = true;
          userFriendlyMessage = "AI prompt generation is rate-limited. Please wait a moment and try again.";
          // Check if the error message contains wait time information
          const waitTimeMatch = errorMessage.match(/try again in (\d+)s/i);
          if (waitTimeMatch) {
            userFriendlyMessage = `AI prompt generation is temporarily rate-limited. Please wait ${waitTimeMatch[1]} seconds and try again.`;
          }
        }
        // Handle invalid API key errors
        else if (errorCode === "invalid_api_key" || openaiRes.status === 401) {
          userFriendlyMessage = "Invalid OpenAI API key. Please check your OPENAI_API_KEY in Edge Function secrets.";
          console.error("❌ OpenAI API key is invalid or expired!");
        }
      } catch {
        // If parsing fails, use the raw text or default message
        errorMessage = errorText || errorMessage;
        if (openaiRes.status === 429) {
          // 429 could be rate limit OR quota - check error message
          if (errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("exceeded")) {
            isQuotaError = true;
            userFriendlyMessage = "OpenAI account has no credits. Please add credits to your OpenAI account.";
          } else {
            isRateLimitError = true;
            userFriendlyMessage = "AI prompt generation is rate-limited. Please wait a moment and try again.";
          }
        }
      }
      
      // Use appropriate status code and details
      let details = `OpenAI API returned status ${openaiRes.status}: ${openaiRes.statusText}`;
      if (isQuotaError) {
        details = "OpenAI account has no credits. Add credits at https://platform.openai.com/account/billing";
      } else if (isRateLimitError) {
        details = "OpenAI rate limit reached. Wait a moment and try again.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: userFriendlyMessage,
          details: details,
          technicalDetails: errorMessage,
          errorCode: isQuotaError ? "insufficient_quota" : (isRateLimitError ? "rate_limit_exceeded" : "unknown"),
        }),
        {
          status: openaiRes.status === 429 ? 429 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("✅ OpenAI API call successful!");
    const openaiJson = await openaiRes.json();
    console.log("OpenAI response structure:", {
      hasChoices: !!openaiJson.choices,
      choicesLength: openaiJson.choices?.length || 0,
      firstChoiceHasMessage: !!openaiJson.choices?.[0]?.message,
      firstChoiceHasContent: !!openaiJson.choices?.[0]?.message?.content,
    });
    
    const promptText: string =
      openaiJson.choices?.[0]?.message?.content?.trim() ?? "";

    console.log("Raw prompt text from OpenAI:", promptText.substring(0, 100) + "...");

    // Clean up the prompt (remove numbering, extra whitespace, etc.)
    const cleanPrompt = promptText
      .replace(/^\d+[\).\s]*/, "") // Remove leading numbers
      .replace(/^[-\*]\s*/, "") // Remove bullet points
      .trim();

    console.log("Cleaned prompt:", cleanPrompt.substring(0, 100) + "...");

    if (!cleanPrompt) {
      console.error("❌ No prompt generated after cleaning!");
      console.error("Raw prompt was:", promptText);
      return new Response(
        JSON.stringify({ error: "No prompt generated" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    
    console.log("✅ Prompt generated successfully, length:", cleanPrompt.length);

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
    const responseData = {
      prompt_text: cleanPrompt,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    
    console.log("✅ Returning response with prompt_text length:", cleanPrompt.length);
    console.log("Response data:", { ...responseData, prompt_text: cleanPrompt.substring(0, 50) + "..." });
    
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("❌ Unexpected error in Edge Function!");
    console.error("Error type:", typeof e);
    console.error("Error:", e);
    console.error("Error message:", e instanceof Error ? e.message : String(e));
    console.error("Error stack:", e instanceof Error ? e.stack : "No stack trace");
    console.error("Error name:", e instanceof Error ? e.name : "Unknown");
    
    // Return a proper error response
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorDetails = e instanceof Error && e.stack ? e.stack : errorMessage;
    
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error",
        details: errorMessage,
        hint: "Check Edge Function logs for more details"
      }),
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
