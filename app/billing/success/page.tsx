"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BillingSuccessPage() {
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setStatus("error");
          return;
        }

        const { error: updateError } = await supabase
          .from("users")
          .update({ subscription_status: "premium" })
          .eq("id", user.id);

        if (updateError) {
          setStatus("error");
          return;
        }

        setStatus("done");

        setTimeout(() => {
          router.push("/billing");
        }, 1500);
      } catch {
        setStatus("error");
      }
    };

    run();
  }, [router]);

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold mb-4">Payment successful 🎉</h1>

      {status === "working" && (
        <p>Updating your account to Premium… please wait a moment.</p>
      )}
      {status === "done" && (
        <p>Your account is now Premium. Redirecting you…</p>
      )}
      {status === "error" && (
        <p>
          Payment worked, but subscription update failed. Try refreshing or
          logging out/in.
        </p>
      )}
    </div>
  );
}
