"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEvaluatorProfile } from "@/lib/actions/evaluator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Mail,
  Calendar,
  User as UserIcon,
  BadgeCheck,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

const formatDate = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "long",
        timeZone: "Asia/Manila",
      }).format(new Date(v))
    : "—";

type Profile = {
  id: string;
  display_name: string | null;
  role: string;
  active: boolean;
  created_at: string | null;
  email: string;
};

export function AccountSettings({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateEvaluatorProfile({ display_name: displayName.trim() || undefined });
        if (result.ok) {
          toast.success("Display name updated.");
          setEditing(false);
          router.refresh();
        }
      } catch {
        toast.error("Could not update profile.");
      }
    });
  };

  const handleCancel = () => {
    setDisplayName(profile.display_name ?? "");
    setEditing(false);
  };

  return (
    <div className="evaluator-page">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-wide text-primary mb-1 uppercase">
          Settings
        </p>
        <h1
          className="text-3xl font-normal text-foreground"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
        >
          Account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your evaluator profile and account details.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground">
                  {profile.display_name || "Evaluator"}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-success" />
                  <span className="text-sm text-muted-foreground capitalize">
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {/* Display name — editable */}
            <div className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <UserIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Display name</p>
                    {editing ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your display name"
                          className="h-8 text-sm max-w-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleCancel();
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-success"
                          onClick={handleSave}
                          disabled={pending}
                          aria-label="Save"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={handleCancel}
                          disabled={pending}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-foreground">
                          {profile.display_name || (
                            <span className="italic text-muted-foreground">Not set</span>
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditing(true)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Edit display name"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm text-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm text-foreground capitalize">{profile.role}</p>
              </div>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Account created</p>
                <p className="text-sm text-foreground">{formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status card */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-3 w-3 rounded-full ${
                  profile.active
                    ? "bg-success shadow-[0_0_6px] shadow-success/50"
                    : "bg-destructive"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {profile.active ? "Active account" : "Inactive account"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profile.active
                    ? "You can review and process submissions."
                    : "Contact an administrator to reactivate your account."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
