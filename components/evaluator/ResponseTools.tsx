"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download, Search } from "lucide-react";

type Row = {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  oec_number: string;
  category: string;
  employer: string;
  position: string;
  jobsite: string;
  departure_date: string;
  status: string;
  decision_reason: string | null;
  decided_at: string | null;
  created_at: string;
};

const formatDate = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeZone: "Asia/Manila",
      }).format(new Date(v))
    : "—";

export default function ResponseTools({
  rows,
  exportMode = false,
}: {
  rows: Row[];
  exportMode?: boolean;
}) {
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [fields, setFields] = useState([
    "reference",
    "full_name",
    "email",
    "status",
    "created_at",
  ]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === "all" || r.status === status) &&
          (!query ||
            [r.reference, r.full_name, r.email, r.oec_number]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (!from || r.created_at.slice(0, 10) >= from) &&
          (!to || r.created_at.slice(0, 10) <= to)
      ),
    [rows, status, from, to, query]
  );

  const toggle = (field: string) =>
    setFields((f) =>
      f.includes(field) ? f.filter((x) => x !== field) : [...f, field]
    );

  const download = () => {
    const labels: Record<string, string> = {
      reference: "Reference",
      full_name: "Applicant",
      email: "Email",
      status: "Status",
      created_at: "Submitted",
      oec_number: "OEC number",
      employer: "Employer",
      position: "Position",
      jobsite: "Jobsite",
    };
    const csv = [
      fields.map((f) => labels[f]).join(","),
      ...filtered.map((r) =>
        fields
          .map(
            (f) =>
              `"${String(r[f as keyof Row] ?? "").replaceAll('"', '""')}"`
          )
          .join(",")
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `oec-responses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      {/* Controls bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, reference, email or OEC"
                className="w-full border border-slate-200 rounded-md py-2 pl-9 pr-3 text-sm focus:border-[#093CA8] focus:ring-2 focus:ring-[#093CA8]/10 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-md py-2 px-3 text-sm focus:border-[#093CA8] focus:ring-2 focus:ring-[#093CA8]/10 outline-none bg-white"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-slate-200 rounded-md py-2 px-3 text-sm focus:border-[#093CA8] focus:ring-2 focus:ring-[#093CA8]/10 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-slate-200 rounded-md py-2 px-3 text-sm focus:border-[#093CA8] focus:ring-2 focus:ring-[#093CA8]/10 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Export field picker */}
      {exportMode && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
          <p className="text-sm font-semibold text-slate-900 mb-3">
            Fields in CSV
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
            {[
              "reference",
              "full_name",
              "email",
              "status",
              "created_at",
              "oec_number",
              "employer",
              "position",
              "jobsite",
            ].map((f) => (
              <label
                key={f}
                className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={fields.includes(f)}
                  onChange={() => toggle(f)}
                  className="accent-[#093CA8] h-4 w-4 rounded"
                />
                {f.replace("_", " ")}
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Generated in your browser from the submissions available to this
              workspace.
            </p>
            <Button onClick={download} size="sm" className="shrink-0">
              <Download className="h-4 w-4 mr-1.5" />
              Download CSV ({filtered.length})
            </Button>
          </div>
        </div>
      )}

      {/* Data table */}
      {!exportMode && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">
                {filtered.length}
              </span>{" "}
              submissions
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
              <caption className="sr-only">All evaluator responses</caption>
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Submitted
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Reference
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Applicant
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    OEC
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Employer / Jobsite
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                      {r.reference}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">
                        {r.full_name}
                      </div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                      {r.oec_number}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-700">{r.employer}</div>
                      <div className="text-xs text-slate-500">
                        {r.position} · {r.jobsite}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          r.status === "verified"
                            ? "default"
                            : r.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/evaluator/submissions/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#093CA8] hover:underline"
                      >
                        Review <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">
                No responses match these filters.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
