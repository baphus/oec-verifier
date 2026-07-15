import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getDashboard } from "@/lib/actions/evaluator";
import { evaluatorLogout } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";
type Params = Promise<{ status?: string; q?: string; page?: string }>;
const statuses = ["", "pending", "verified", "rejected", "revoked"] as const;
const date = (value: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

async function loadDashboard(searchParams: Params) {
  try {
    await requireActiveEvaluator(); const params = await searchParams;
    const status = statuses.includes((params.status ?? "") as (typeof statuses)[number]) ? (params.status || undefined) : undefined;
    const page = Math.max(0, Number.parseInt(params.page ?? "0", 10) || 0); const result = await getDashboard({ status, query: params.q, page });
    return { params, status, result };
  } catch { redirect("/evaluator/login"); }
}

export default async function EvaluatorDashboard({ searchParams }: { searchParams: Params }) {
  const { params, status, result } = await loadDashboard(searchParams);
  return <main className="evaluator-shell"><header className="evaluator-header"><div><p className="eyebrow">OEC VERIFY · EVALUATOR</p><h1>Applications</h1><p className="muted">Review and record decisions securely.</p></div><form action={evaluatorLogout}><Button variant="outline">Sign out</Button></form></header><section className="evaluator-toolbar"><form className="evaluator-search"><Input name="q" defaultValue={params.q} placeholder="Search name, reference, or OEC" aria-label="Search submissions" /><input type="hidden" name="status" value={params.status ?? ""} /><Button type="submit">Search</Button></form><nav className="status-filters" aria-label="Filter submissions">{statuses.map((item) => <Link className={(status ?? "") === (item || "") ? "active" : ""} key={item || "all"} href={`/evaluator?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), ...(item ? { status: item } : {}) })}`}>{item ? item[0].toUpperCase() + item.slice(1) : "All"}</Link>)}</nav></section><Card className="evaluator-table-wrap"><CardHeader><CardTitle>Submissions <span className="table-total">{result.total} total</span></CardTitle></CardHeader><CardContent className="p-0">{result.submissions.length ? <div className="evaluator-table-scroll"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Applicant</TableHead><TableHead>OEC</TableHead><TableHead>Category / jobsite</TableHead><TableHead>Status</TableHead><TableHead>Review</TableHead></TableRow></TableHeader><TableBody>{result.submissions.map((submission) => <TableRow key={submission.id}><TableCell>{date(submission.created_at)}</TableCell><TableCell className="mono">{submission.reference}</TableCell><TableCell>{submission.full_name}</TableCell><TableCell className="mono">{submission.oec_number}</TableCell><TableCell>{submission.position}<br /><span className="muted">{submission.employer}</span></TableCell><TableCell><Badge variant={submission.status === "verified" ? "default" : submission.status === "rejected" || submission.status === "revoked" ? "destructive" : "secondary"}>{submission.status}</Badge></TableCell><TableCell><Link className="text-link" href={`/evaluator/submissions/${submission.id}`}>Review</Link></TableCell></TableRow>)}</TableBody></Table></div> : <p className="empty-state">No submissions match this filter.</p>}</CardContent></Card></main>;
}
