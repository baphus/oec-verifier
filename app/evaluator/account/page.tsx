import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getEvaluatorProfile } from "@/lib/actions/evaluator";
import { AccountSettings } from "@/components/evaluator/AccountSettings";

export const dynamic = "force-dynamic";

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
  return <AccountSettings profile={profile} />;
}
