import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getEvaluatorProfile } from "@/lib/actions/evaluator";
import { ShieldCheck, Mail, Calendar, User as UserIcon, BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const formatDate = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "long",
        timeZone: "Asia/Manila",
      }).format(new Date(v))
    : "—";

async function load() {
  try {
    await requireActiveEvaluator();
    return await getEvaluatorProfile();
  } catch {
    redirect("/evaluator/login");
  }
}

export default async function AccountPage() {
  const profile = await load();

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
              <div>
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
            <div className="px-6 py-4 flex items-center gap-4">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm text-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Display name</p>
                <p className="text-sm text-foreground">
                  {profile.display_name || "Not set"}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm text-foreground capitalize">
                  {profile.role}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Account created</p>
                <p className="text-sm text-foreground">
                  {formatDate(profile.created_at)}
                </p>
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
