"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { evaluatorLogin } from "@/app/evaluator/actions";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="evaluator-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError("");
        startTransition(async () => {
          try {
            const result = await evaluatorLogin({
              email: String(form.get("email") ?? ""),
              password: String(form.get("password") ?? ""),
            });
            if (result.ok) {
              toast.success("Signed in successfully.");
              router.push("/evaluator");
            } else {
              toast.error("Sign-in failed. Check your credentials.");
              setError(result.error ?? "Unable to sign in.");
            }
          } catch {
            toast.error("Sign-in failed. Please try again.");
            setError("Unable to sign in. Please try again.");
          }
        });
      }}
    >
      <div className="auth-field">
        <Label htmlFor="evaluator-email">Email</Label>
        <Input
          id="evaluator-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="auth-field">
        <Label htmlFor="evaluator-password">Password</Label>
        <div className="auth-password-wrap">
          <Input
            id="evaluator-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button className="w-full auth-submit" disabled={pending}>
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
      </Button>
    </form>
  );
}
