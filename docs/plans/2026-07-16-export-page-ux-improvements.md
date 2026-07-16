# Export Page UX Improvements Implementation Plan

**Goal:** Transform the export page from a full-featured data table view into a streamlined, purpose-built export tool with date filtering, better field organization, and a cleaner interface.

**Architecture:** Modify the existing `ResponseTools` component (shared between responses and export pages) to conditionally render different UI based on `exportMode`. Add date range filtering state and apply it to both the displayed count and CSV download. Group field checkboxes by category for better usability.

**Tech Stack:** Next.js 16, React 19, TanStack React Table, Tailwind CSS, shadcn/ui, lucide-react icons

---

## Global Constraints

- Preserve existing responses page functionality (non-export mode)
- Use existing shadcn/ui components (Input, Button, Badge, Select, Popover)
- Follow existing Tailwind utility class patterns
- No new dependencies (use native HTML date inputs)
- Maintain `exportMode` prop as the conditional flag

---

## File Structure

| File | Purpose |
|------|---------|
| `components/evaluator/ResponseTools.tsx` | Main component — add date filtering, group fields, conditionally hide controls |
| `components/evaluator/ExportFieldPicker.tsx` | **New** — extracted field picker with grouped checkboxes |
| `components/evaluator/DateRangeFilter.tsx` | **New** — date range inputs with quick presets |
| `app/evaluator/export/page.tsx` | Minor cleanup (remove email delivery, already handled by fixer) |

---

## Task 1: Date Range Filter Component

**Files:**
- Create: `components/evaluator/DateRangeFilter.tsx`
- Modify: `components/evaluator/ResponseTools.tsx` (consume component)

**Interfaces:**
- Consumes: None (standalone)
- Produces: `<DateRangeFilter from={string} to={string} onChange={fn} />`

- [ ] **Step 1: Create DateRangeFilter component**

```tsx
// components/evaluator/DateRangeFilter.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type DateRange = { from: string; to: string };

type DateRangeFilterProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
};

const presets = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "This month", days: "month" as const },
  { label: "All time", days: null },
];

function toLocalDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getPresetRange(days: number | "month" | null): DateRange {
  if (days === null) return { from: "", to: "" };
  const to = new Date();
  const from = new Date();
  if (days === "month") {
    from.setDate(1);
  } else {
    from.setDate(from.getDate() - days);
  }
  return { from: toLocalDateStr(from), to: toLocalDateStr(to) };
}

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-foreground">Date Submitted</div>
      
      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const range = getPresetRange(preset.days);
          const isActive = value.from === range.from && value.to === range.to;
          return (
            <Button
              key={preset.label}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChange(range)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      {/* Manual date inputs */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="date-from" className="text-xs text-muted-foreground">From</Label>
          <input
            id="date-from"
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="mt-1 w-full h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="date-to" className="text-xs text-muted-foreground">To</Label>
          <input
            id="date-to"
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="mt-1 w-full h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        {(value.from || value.to) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onChange({ from: "", to: "" })}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify component renders without errors**

Run: `npm run build` (or `npm run dev` and check the page)
Expected: No TypeScript errors

---

## Task 2: Grouped Field Picker Component

**Files:**
- Create: `components/evaluator/ExportFieldPicker.tsx`
- Modify: `components/evaluator/ResponseTools.tsx` (consume component)

**Interfaces:**
- Consumes: None (standalone)
- Produces: `<ExportFieldPicker fields={string[]} allFields={string[]} labels={Record} onToggle={fn} onToggleAll={fn} />`

- [ ] **Step 1: Create ExportFieldPicker with grouped fields**

```tsx
// components/evaluator/ExportFieldPicker.tsx
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type FieldGroup = {
  label: string;
  fields: string[];
};

const fieldGroups: FieldGroup[] = [
  {
    label: "Personal Info",
    fields: ["full_name", "email", "gender", "contact_number"],
  },
  {
    label: "OEC Details",
    fields: ["reference", "oec_number", "category", "position", "jobsite"],
  },
  {
    label: "Location",
    fields: ["province", "region"],
  },
  {
    label: "Dates",
    fields: ["created_at", "departure_date", "issued_at", "expires_at"],
  },
  {
    label: "Evaluation",
    fields: ["status", "decided_at", "decided_by_name"],
  },
];

type ExportFieldPickerProps = {
  selectedFields: string[];
  labels: Record<string, string>;
  onToggle: (field: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
};

export default function ExportFieldPicker({
  selectedFields,
  labels,
  onToggle,
  onToggleAll,
  allSelected,
}: ExportFieldPickerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Fields in CSV</p>
        <button
          type="button"
          onClick={onToggleAll}
          className="text-xs font-medium text-primary hover:underline"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      {fieldGroups.map((group) => (
        <div key={group.label}>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {group.label}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {group.fields.map((f) => (
              <label
                key={f}
                className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer"
              >
                <Checkbox
                  checked={selectedFields.includes(f)}
                  onCheckedChange={() => onToggle(f)}
                />
                {labels[f] ?? f.replace(/_/g, " ")}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify component renders without errors**

Run: `npm run build`
Expected: No TypeScript errors

---

## Task 3: Integrate Components into ResponseTools

**Files:**
- Modify: `components/evaluator/ResponseTools.tsx`

**Interfaces:**
- Consumes: `<DateRangeFilter />`, `<ExportFieldPicker />`
- Produces: Updated export mode UI

- [ ] **Step 1: Add imports and state**

Add to imports:
```tsx
import DateRangeFilter from "@/components/evaluator/DateRangeFilter";
import ExportFieldPicker from "@/components/evaluator/ExportFieldPicker";
```

Add state after existing state declarations (around line 286):
```tsx
const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
```

- [ ] **Step 2: Add date filtering logic**

Add after the `clearAllFilters` function (around line 667):
```tsx
// ── Date range filtering ──
const filteredRows = useMemo(() => {
  if (!dateRange.from && !dateRange.to) return rows;
  return rows.filter((r) => {
    const created = new Date(r.created_at);
    if (dateRange.from && created < new Date(dateRange.from)) return false;
    if (dateRange.to) {
      const toEnd = new Date(dateRange.to);
      toEnd.setHours(23, 59, 59, 999);
      if (created > toEnd) return false;
    }
    return true;
  });
}, [rows, dateRange]);
```

- [ ] **Step 3: Update export mode UI**

Replace the entire `{exportMode && (...)}` block (lines 960-998) with:

```tsx
{exportMode && (
  <div className="bg-card border border-border rounded-lg p-5 mb-6">
    {/* Date Range Filter */}
    <div className="mb-5">
      <DateRangeFilter value={dateRange} onChange={setDateRange} />
    </div>

    <div className="border-t border-border pt-5">
      {/* Field Picker */}
      <ExportFieldPicker
        selectedFields={fields}
        labels={labels}
        onToggle={toggle}
        onToggleAll={toggleAll}
        allSelected={allSelected}
      />
    </div>

    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
      <p className="text-xs text-muted-foreground">
        {dateRange.from || dateRange.to
          ? `${filteredRows.length} of ${rows.length} records match your filters`
          : "Generated in your browser from the submissions available to this workspace."}
      </p>
      <Button onClick={download} size="sm" className="shrink-0">
        <Download className="h-4 w-4 mr-1.5" />
        Download CSV ({filteredRows.length})
      </Button>
    </div>
  </div>
)}
```

- [ ] **Step 4: Update download function to use filteredRows**

Replace the `download` function (lines 745-760) with:

```tsx
const download = () => {
  const dataToExport = filteredRows;
  const csv = [
    fields.map((f) => labels[f] || f.replace(/_/g, " ")).join(","),
    ...dataToExport.map((r) =>
      fields
        .map((f) => `"${String((r as any)[f] ?? "").replaceAll('"', '""')}"`)
        .join(",")
    ),
  ].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  
  // Include date range in filename if filtered
  let filename = "oec-responses";
  if (dateRange.from || dateRange.to) {
    filename += `-${dateRange.from || "start"}-to-${dateRange.to || "end"}`;
  }
  filename += `-${new Date().toISOString().slice(0, 10)}.csv`;
  
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};
```

- [ ] **Step 5: Update default fields**

Change the initial `fields` state (line 314) to include more useful defaults:

```tsx
const [fields, setFields] = useState([
  "reference",
  "full_name",
  "email",
  "oec_number",
  "category",
  "status",
  "created_at",
]);
```

- [ ] **Step 6: Verify integration**

Run: `npm run build`
Expected: No TypeScript errors, export page shows date picker and grouped fields

---

## Task 4: Simplify Export Page (Remove Table)

**Files:**
- Modify: `app/evaluator/export/page.tsx`

**Interfaces:**
- Consumes: Updated `ResponseTools` component
- Produces: Cleaner export page without table

- [ ] **Step 1: Simplify the export page**

Replace the content of `app/evaluator/export/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getAllSubmissions, getDecisionAuthors } from "@/lib/actions/evaluator";
import ResponseTools from "@/components/evaluator/ResponseTools";

export const dynamic = "force-dynamic";

async function load() {
  try {
    await requireActiveEvaluator();
    const rows = await getAllSubmissions();
    const authorIds = Array.from(
      new Set(rows.map((r) => r.decided_by).filter(Boolean))
    ) as string[];
    const authors = authorIds.length
      ? await getDecisionAuthors(authorIds)
      : ({} as Record<string, string>);
    return rows.map((r) => ({
      ...r,
      decided_by_name: r.decided_by ? (authors[r.decided_by] ?? null) : null,
    }));
  } catch {
    redirect("/evaluator/login");
  }
}

export default async function ExportPage() {
  const rows = await load();
  return (
    <div className="evaluator-page max-w-4xl">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-wide text-primary mb-1 uppercase">
          Data Export
        </p>
        <h1
          className="text-3xl font-normal text-foreground"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
        >
          Export responses
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a date range, select the fields you need, and download a CSV.
        </p>
      </div>

      <ResponseTools rows={rows} exportMode />
    </div>
  );
}
```

- [ ] **Step 2: Verify page renders correctly**

Run: `npm run dev` and navigate to `/evaluator/export`
Expected: Clean export interface with date picker, grouped fields, and download button

---

## Task 5: Update Default Fields Label

**Files:**
- Modify: `components/evaluator/ResponseTools.tsx`

**Interfaces:**
- Consumes: None
- Produces: Updated labels

- [ ] **Step 1: Add missing label**

In the `labels` object (around line 322), add:
```tsx
departure_date: "Departure",
```

(This may already exist — verify before adding)

- [ ] **Step 2: Verify labels are complete**

Check that all fields in `allFields` have corresponding labels.

---

## Verification Checklist

After completing all tasks:

- [ ] Export page loads without errors
- [ ] Date range filter works (presets and manual inputs)
- [ ] Field picker shows grouped checkboxes
- [ ] CSV download includes only selected fields
- [ ] CSV download respects date filter
- [ ] Filename includes date range when filtered
- [ ] Responses page (`/evaluator/responses`) still works with all controls
- [ ] No TypeScript errors (`npm run build`)
- [ ] No console errors in browser

---

## Success Criteria

1. Users can filter submissions by date range before exporting
2. Field selection is organized by category (Personal, OEC, Location, Dates, Evaluation)
3. Export page is clean and focused (no table, no search, no filters)
4. Download button shows accurate count of records being exported
5. Filenames are descriptive and include filter context
