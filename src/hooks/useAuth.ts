import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const clearInvalidLocalSession = async () => {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Local cleanup is best-effort; state below still moves the UI out of loading.
      }
      if (!mounted) return;
      setSession(null);
      setUser(null);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session) {
          setTimeout(() => {
            supabase.auth.getUser().then(({ error }) => {
              if (error && mounted) void clearInvalidLocalSession();
            });
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (!session) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error || !user) {
        await clearInvalidLocalSession();
        return;
      }

      setSession(session);
      setUser(user);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
