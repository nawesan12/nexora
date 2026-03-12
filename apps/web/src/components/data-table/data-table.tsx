"use client";

import { useState, useRef, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type Row,
  type OnChangeFn,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // Server-side pagination
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  // Features
  searchKey?: string;
  searchPlaceholder?: string;
  filterOptions?: {
    key: string;
    label: string;
    options: { label: string; value: string }[];
  }[];
  // State
  isLoading?: boolean;
  // Empty state
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIllustration?: React.ReactNode;
  emptyAction?: { label: string; href?: string; onClick?: () => void; icon?: React.ReactNode };
  // Virtual scrolling (for large datasets)
  enableVirtualization?: boolean;
  virtualRowHeight?: number;
  maxHeight?: string;
  // Row selection
  enableRowSelection?: boolean;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  rowSelection?: RowSelectionState;
  // Bulk actions
  bulkActions?: React.ReactNode;
  // Row click
  onRowClick?: (row: Row<TData>) => void;
  // Custom toolbar actions (right side)
  toolbarActions?: React.ReactNode;
  // Styling
  className?: string;
  compact?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
  searchKey,
  searchPlaceholder,
  filterOptions,
  isLoading,
  emptyIcon,
  emptyMessage = "No hay datos",
  emptyDescription,
  emptyIllustration,
  emptyAction,
  enableVirtualization = false,
  virtualRowHeight = 52,
  maxHeight = "600px",
  enableRowSelection = false,
  onRowSelectionChange,
  rowSelection: externalRowSelection,
  bulkActions,
  onRowClick,
  toolbarActions,
  className,
  compact = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({});

  const rowSelection = externalRowSelection ?? internalRowSelection;
  const setRowSelection = onRowSelectionChange ?? setInternalRowSelection;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  const { rows } = table.getRowModel();

  // Virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => virtualRowHeight,
    getScrollElement: () => tableContainerRef.current,
    overscan: 10,
    enabled: enableVirtualization,
  });

  const selectedCount = Object.keys(rowSelection).length;
  const hasServerPagination = page !== undefined && totalPages !== undefined && onPageChange !== undefined;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      {(searchKey || filterOptions || toolbarActions) && (
        <DataTableToolbar
          table={table}
          searchKey={searchKey}
          searchPlaceholder={searchPlaceholder}
          filterOptions={filterOptions}
          toolbarActions={toolbarActions}
        />
      )}

      {/* Bulk actions bar */}
      {enableRowSelection && selectedCount > 0 && bulkActions && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-2.5">
          <span className="text-sm font-medium text-[var(--accent)]">
            {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
          </span>
          <div className="h-4 w-px bg-border" />
          {bulkActions}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border-0 bg-card shadow-sm overflow-hidden">
        <div
          ref={tableContainerRef}
          className={cn(
            "overflow-auto",
            enableVirtualization && `max-h-[${maxHeight}]`,
          )}
          style={enableVirtualization ? { maxHeight } : undefined}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-border/50 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                        compact ? "h-9 px-3" : "h-11 px-4",
                      )}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-48"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Cargando...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-64"
                  >
                    <EmptyState
                      illustration={emptyIllustration}
                      icon={emptyIcon}
                      title={emptyMessage}
                      description={emptyDescription}
                      action={emptyAction}
                      size="md"
                    />
                  </TableCell>
                </TableRow>
              ) : enableVirtualization ? (
                // Virtual rows
                <>
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <TableRow style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px` }}>
                      <TableCell colSpan={columns.length} className="p-0" />
                    </TableRow>
                  )}
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={cn(
                          "transition-colors",
                          onRowClick && "cursor-pointer",
                          row.getIsSelected() && "bg-[var(--accent)]/5",
                        )}
                        onClick={() => onRowClick?.(row)}
                        style={{ height: `${virtualRow.size}px` }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(compact ? "px-3 py-2" : "px-4 py-3")}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <TableRow
                      style={{
                        height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems().at(-1)?.end ?? 0)}px`,
                      }}
                    >
                      <TableCell colSpan={columns.length} className="p-0" />
                    </TableRow>
                  )}
                </>
              ) : (
                // Regular rows
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "transition-colors border-b border-border/30",
                      onRowClick && "cursor-pointer",
                      row.getIsSelected() && "bg-[var(--accent)]/5",
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(compact ? "px-3 py-2" : "px-4 py-3")}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {hasServerPagination && (
          <div className="border-t border-border/30 px-4 py-3">
            <DataTablePagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={onPageChange}
              selectedCount={enableRowSelection ? selectedCount : undefined}
              totalRows={data.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
