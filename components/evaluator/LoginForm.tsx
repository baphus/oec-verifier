"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { evaluatorLogin } from "@/app/evaluator/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const [error, setError] = useState(""); const [pending, startTransition] = useTransition(); const router = useRouter();
  return <form className="evaluator-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setError(""); startTransition(async () => { const result = await evaluatorLogin({ email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") }); if (result.ok) router.push("/evaluator"); else setError(result.error ?? "Unable to sign in."); }); }}>
    <Label htmlFor="evaluator-email">Email</Label><Input id="evaluator-email" name="email" type="email" autoComplete="username" required />
    <Label htmlFor="evaluator-password">Password</Label><Input id="evaluator-password" name="password" type="password" autoComplete="current-password" required />
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<Button className="w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
  </form>;
}
