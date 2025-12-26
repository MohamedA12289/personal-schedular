"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase/client";

function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

function usernameToEmail(username: string) {
  return `${normalizeUsername(username)}@shiesty.local`;
}

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    setErr(null);
    setLoading(true);

    const clean = normalizeUsername(username);
    if (!clean) {
      setLoading(false);
      return setErr("Username required.");
    }
    if (clean.length < 3) {
      setLoading(false);
      return setErr("Username must be at least 3 characters.");
    }

    const email = usernameToEmail(clean);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: clean }, // metadata (optional)
      },
    });

    if (error) {
      setLoading(false);
      return setErr(error.message);
    }

    // Save username to profiles table if you have it
    if (data.user) {
      const { error: profErr } = await supabase.from("profiles").upsert({
        user_id: data.user.id,
        username: clean,
      });
      if (profErr) {
        // not fatal, but nice to show
        console.warn("profiles upsert error", profErr.message);
      }
    }

    setLoading(false);
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-5">
        <h1 className="text-xl font-semibold">Sign up</h1>
        <p className="text-sm text-zinc-400 mt-1">My personal shiesty planner</p>

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 outline-none"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 outline-none"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          {err && <div className="text-sm text-red-400">{err}</div>}

          <button
            onClick={onSignup}
            disabled={loading}
            className="w-full rounded-xl bg-teal-500 py-2 font-semibold text-black hover:bg-teal-400 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <a className="text-sm text-teal-300 hover:underline" href="/login">
            Already got one? Log in
          </a>
        </div>
      </div>
    </div>
  );
}
