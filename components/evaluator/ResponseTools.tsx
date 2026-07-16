"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusHelp } from "@/components/evaluator/StatusHelp";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowRight,
  CheckCircle2,
  CheckCircle,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleX,
  Columns3,
  Download,
  Ellipsis,
  Filter,
  ListFilter,
  Search,
  Trash,
  XCircle,
} from "lucide-react";
import { bulkRejectForEvaluator, bulkVerifyForEvaluator } from "@/app/evaluator/actions";
import { getDecisionAuthors } from "@/lib/actions/evaluator";

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
  decided_by: string | null;
  decided_by_name: string | null;
  created_at: string;
};

type ResponseToolsProps = {
  rows: Row[];
  exportMode?: boolean;
};

const formatDate = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeZone: "Asia/Manila",
      }).format(new Date(v))
    : "—";

const statusBadgeVariant = (status: string) =>
  status === "verified"
    ? "default"
    : status === "pending"
      ? "secondary"
      : "destructive" as const;

// Multi-column search filter
const multiColumnFilterFn: FilterFn<Row> = (row, columnId, filterValue) => {
  const searchableRowContent = `${row.original.reference} ${row.original.full_name} ${row.original.email} ${row.original.oec_number}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

// Status filter
const statusFilterFn: FilterFn<Row> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId) as string;
  return filterValue.includes(status);
};

export default function ResponseTools({ rows, exportMode = false }: ResponseToolsProps) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // ── Author name lookup (fetched fresh on mount to bust Router Cache) ──
  const [authorNames, setAuthorNames] = useState<Record<string, string> | null>(null);
  // Ref keeps the cell closure honest — memoized columns capture null without it
  const authorNamesRef = useRef(authorNames);
  authorNamesRef.current = authorNames;

  useEffect(() => {
    const ids = rows.map((r) => r.decided_by).filter(Boolean) as string[];
    if (ids.length > 0) {
      getDecisionAuthors(Array.from(new Set(ids))).then(setAuthorNames).catch(() => {});
    } else {
      setAuthorNames({});
    }
    // Intentionally only on mount — fresh fetch every client nav
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Export state ──
  const [fields, setFields] = useState([
    "reference",
    "full_name",
    "email",
    "status",
    "created_at",
  ]);

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
    departure_date: "Departure",
    decided_at: "Evaluated on",
    decided_by_name: "Evaluated by",
  };

  const allFields = [
    "reference",
    "full_name",
    "email",
    "status",
    "created_at",
    "oec_number",
    "employer",
    "position",
    "jobsite",
    "departure_date",
    "decided_at",
    "decided_by_name",
  ];

  // ── Bulk action state ──
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // ── Hiding some columns by default on narrow screens ──
  // (columns are hidden via columnVisibility state)

  // ── Columns definition ──
  const columns: ColumnDef<Row>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 28,
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "Reference",
      accessorKey: "reference",
      cell: ({ row }) => (
        <Link
          href={`/evaluator/submissions/${row.original.id}`}
          className="font-mono text-xs font-medium text-primary hover:underline"
        >
          {row.getValue("reference")}
        </Link>
      ),
      size: 130,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Applicant",
      accessorKey: "full_name",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate max-w-[180px]">
            {row.getValue("full_name")}
          </div>
          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
            {row.original.email}
          </div>
        </div>
      ),
      size: 200,
      filterFn: multiColumnFilterFn,
    },
    {
      header: "Employer",
      accessorKey: "employer",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="text-foreground truncate max-w-[160px]">{row.getValue("employer")}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[160px]">
            {row.original.position}
          </div>
        </div>
      ),
      size: 180,
    },
    {
      header: "Jobsite",
      accessorKey: "jobsite",
      cell: ({ row }) => (
        <span className="text-muted-foreground truncate max-w-[140px] inline-block">
          {row.getValue("jobsite")}
        </span>
      ),
      size: 140,
    },
    {
      header: "Departure",
      accessorKey: "departure_date",
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatDate(row.getValue("departure_date"))}
        </span>
      ),
      size: 120,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5">
          <Badge variant={statusBadgeVariant(row.getValue("status"))}>
            {row.getValue("status")}
          </Badge>
          <StatusHelp status={row.getValue("status")} />
        </span>
      ),
      size: 110,
      filterFn: statusFilterFn,
    },
    {
      header: "Submitted",
      accessorKey: "created_at",
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatDate(row.getValue("created_at"))}
        </span>
      ),
      size: 130,
    },
    {
      header: "Evaluated on",
      accessorKey: "decided_at",
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatDate(row.getValue("decided_at"))}
        </span>
      ),
      size: 130,
    },
    {
      header: "Evaluated by",
      accessorKey: "decided_by_name",
      cell: ({ row }) => {
        const freshName =
          row.original.decided_by && authorNamesRef.current
            ? (authorNamesRef.current[row.original.decided_by] ?? null)
            : null;
        return (
          <span className="text-muted-foreground">
            {freshName ?? row.original.decided_by_name ?? "—"}
          </span>
        );
      },
      size: 140,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <Link
          href={`/evaluator/submissions/${row.original.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
        >
          Review <ArrowRight className="h-3 w-3" />
        </Link>
      ),
      size: 80,
      enableHiding: false,
    },
  ], []);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      columnVisibility: {
        departure_date: false,
        decided_at: false,
        decided_by_name: false,
      },
    },
  });

  // ── Status facet values for the filter popover ──
  const uniqueStatusValues = useMemo(() => {
    const statusColumn = table.getColumn("status");
    if (!statusColumn) return [];
    return Array.from(statusColumn.getFacetedUniqueValues().keys()).sort();
  }, [table.getColumn("status")?.getFacetedUniqueValues()]);

  const statusCounts = useMemo(() => {
    const statusColumn = table.getColumn("status");
    if (!statusColumn) return new Map<string, number>();
    return statusColumn.getFacetedUniqueValues();
  }, [table.getColumn("status")?.getFacetedUniqueValues()]);

  const selectedStatuses = useMemo(() => {
    const filterValue = table.getColumn("status")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn("status")?.getFilterValue()]);

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("status")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];
    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) newFilterValue.splice(index, 1);
    }
    table.getColumn("status")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  // ── Search filter ──
  const searchValue = (table.getColumn("reference")?.getFilterValue() ?? "") as string;
  const handleSearchChange = (value: string) => {
    table.getColumn("reference")?.setFilterValue(value);
  };

  // ── Bulk actions ──
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedIds = selectedRows.map((r) => r.original.id);
  const selectedCount = selectedIds.length;

  const hasSelectedPending = selectedRows.some((r) => r.original.status === "pending");

  const handleBulkVerify = () => {
    const pendingIds = selectedRows
      .filter((r) => r.original.status === "pending")
      .map((r) => r.original.id);
    if (!pendingIds.length) return;
    startTransition(async () => {
      await bulkVerifyForEvaluator(pendingIds);
      table.resetRowSelection();
    });
  };

  const handleBulkReject = () => {
    const pendingIds = selectedRows
      .filter((r) => r.original.status === "pending")
      .map((r) => r.original.id);
    if (!pendingIds.length) return;
    startTransition(async () => {
      await bulkRejectForEvaluator(
        pendingIds.map((id) => ({ id, reason: rejectReason }))
      );
      setRejectReason("");
      setRejectDialogOpen(false);
      table.resetRowSelection();
    });
  };

  // ── Export ──
  const allSelected = allFields.every((f) => fields.includes(f));
  const toggleAll = () => setFields(allSelected ? [] : [...allFields]);
  const toggle = (field: string) =>
    setFields((f) => (f.includes(field) ? f.filter((x) => x !== field) : [...f, field]));

  const download = () => {
    const filteredData = rows;
    const csv = [
      fields.map((f) => labels[f] || f.replace(/_/g, " ")).join(","),
      ...filteredData.map((r) =>
        fields
          .map((f) => `"${String((r as any)[f] ?? "").replaceAll('"', '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `oec-responses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Render ──
  return (
    <>
      {/* ── Filters & Controls bar (demo style) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Input
              ref={inputRef}
              className={`peer min-w-60 ps-9 ${searchValue ? "pe-9" : ""}`}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name, ref, email, OEC..."
              type="text"
              aria-label="Search submissions"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            {searchValue && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  handleSearchChange("");
                  inputRef.current?.focus();
                }}
              >
                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                Status
                {selectedStatuses.length > 0 && (
                  <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {selectedStatuses.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Filters</div>
                <div className="space-y-3">
                  {uniqueStatusValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`status-${i}`}
                        checked={selectedStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) => handleStatusChange(checked, value)}
                      />
                      <Label htmlFor={`status-${i}`} className="flex grow justify-between gap-2 font-normal">
                        {value}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {statusCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {labels[column.id] ?? column.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side: bulk actions (demo style — inline when rows selected) */}
        <div className="flex items-center gap-3">
          {selectedCount > 0 && !exportMode && (
            <>
              <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!hasSelectedPending || isPending}>
                    <XCircle className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                    Reject
                    <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                      {selectedCount}
                    </span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border" aria-hidden="true">
                      <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
                    </div>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject {selectedCount} submission{selectedCount > 1 ? "s" : ""}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Rejecting will mark the submission as rejected. The applicant will be notified by email.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                  </div>
                  <div className="px-6 pb-2">
                    <Label htmlFor="reject-reason" className="text-sm font-medium">
                      Remarks <span className="text-destructive">*</span>
                    </Label>
                    <textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this submission was rejected..."
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 min-h-[80px] resize-y"
                      rows={3}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setRejectReason("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkReject}
                      disabled={!rejectReason.trim() || isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isPending ? "Rejecting..." : "Reject"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelectedPending || isPending}
                onClick={handleBulkVerify}
              >
                <CheckCircle className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                {isPending ? "Verifying..." : "Verify"}
                <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                  {selectedCount}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.resetRowSelection()}
              >
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Export mode: field picker + download ── */}
      {exportMode && (
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Fields in CSV</p>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
            {allFields.map((f) => (
              <label
                key={f}
                className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={fields.includes(f)}
                  onChange={() => toggle(f)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                {labels[f] ?? f.replace(/_/g, " ")}
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Generated in your browser from the submissions available to this workspace.
            </p>
            <Button onClick={download} size="sm" className="shrink-0">
              <Download className="h-4 w-4 mr-1.5" />
              Download CSV ({rows.length})
            </Button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {!exportMode && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {table.getRowModel().rows.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {rows.length}
              </span>{" "}
              submissions
            </p>
          </div>
          <div className="overflow-x-auto" role="region" aria-label="All evaluator responses table" tabIndex={0}>
            <Table className="min-w-[800px]">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: `${header.getSize()}px` }}
                        className="h-11"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className="flex h-full cursor-pointer select-none items-center justify-between gap-2"
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={(e) => {
                              if (
                                header.column.getCanSort() &&
                                (e.key === "Enter" || e.key === " ")
                              ) {
                                e.preventDefault();
                                header.column.getToggleSortingHandler()?.(e);
                              }
                            }}
                            tabIndex={header.column.getCanSort() ? 0 : undefined}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: (
                                <ChevronUp className="shrink-0 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                              ),
                              desc: (
                                <ChevronDown className="shrink-0 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                              ),
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="last:py-0">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-5 w-5 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">No submissions match these filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-border">
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Rows per page
              </Label>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="w-fit h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="text-foreground">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                -
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getRowCount(),
                )}
              </span>{" "}
              of <span className="text-foreground">{table.getRowCount().toString()}</span>
            </p>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Go to first page"
                  >
                    <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Go to previous page"
                  >
                    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Go to next page"
                  >
                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Go to last page"
                  >
                    <ChevronLast size={16} strokeWidth={2} aria-hidden="true" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </>
  );
}
