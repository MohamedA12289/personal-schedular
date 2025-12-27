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

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setErr(null);
    setLoading(true);

    const clean = normalizeUsername(username);
    if (!clean) {
      setLoading(false);
      return setErr("Username required.");
    }

    const email = usernameToEmail(clean);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) return setErr("Wrong username or password.");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-5">
        <h1 className="text-xl font-semibold">Log in</h1>
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
            autoComplete="current-password"
          />

          {err && <div className="text-sm text-red-400">{err}</div>}

          <button
            onClick={onLogin}
            disabled={loading}
            className="w-full rounded-xl bg-teal-500 py-2 font-semibold text-black hover:bg-teal-400 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          <a className="text-sm text-teal-300 hover:underline" href="/signup">
            Need an account? Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
