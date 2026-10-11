"use client";

import { signOutAction } from "@/app/actions";
import { resetSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  function handleClientCleanup() {
    try {
      resetSupabaseBrowserClient();
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch {
      // Ignore
    }
  }

  return (
    <form
      action={signOutAction}
      className="inline-flex"
      onSubmit={handleClientCleanup}
    >
      <button
        className="hover-lift cursor-pointer rounded-full bg-[linear-gradient(135deg,#1f7a63,#165846)] px-4 py-2 text-sm font-semibold text-brand-foreground shadow-[0_16px_34px_rgba(20,59,42,0.18)] transition-all hover:opacity-90 active:scale-95"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}

