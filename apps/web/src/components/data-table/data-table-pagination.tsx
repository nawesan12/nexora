"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  selectedCount?: number;
  totalRows?: number;
}

export function DataTablePagination({
  page,
  totalPages,
  totalItems,
  pageSize = 20,
  onPageChange,
  selectedCount,
  totalRows,
}: DataTablePaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems ?? page * pageSize);

  // Generate page numbers to show
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {selectedCount !== undefined && selectedCount > 0 ? (
          <span>
            <span className="font-medium text-foreground">{selectedCount}</span>{" "}
            de {totalRows} seleccionado{selectedCount !== 1 ? "s" : ""}
          </span>
        ) : totalItems !== undefined ? (
          <span>
            <span className="font-medium text-foreground">{start}-{end}</span>{" "}
            de{" "}
            <span className="font-medium text-foreground">
              {totalItems.toLocaleString("es-AR")}
            </span>{" "}
            resultados
          </span>
        ) : (
          <span>
            Pagina{" "}
            <span className="font-medium text-foreground">{page}</span>{" "}
            de{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hidden sm:flex"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-0.5">
          {getPageNumbers().map((pageNum, i) =>
            pageNum === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "ghost"}
                size="icon"
                className={`h-8 w-8 text-xs font-medium ${
                  pageNum === page
                    ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm"
                    : ""
                }`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            ),
          )}
        </div>

        {/* Mobile page indicator */}
        <span className="flex sm:hidden px-2 text-xs text-muted-foreground">
          {page}/{totalPages}
        </span>

        {/* Next */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hidden sm:flex"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
