"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import {
  TableFetchOverlay,
  type TableFetchTrigger,
} from "@/components/tables/table-fetch-overlay"
import { Button } from "@/components/ui/button"

export interface ColumnDef<T> {
  header: React.ReactNode | string
  accessorKey?: keyof T | string
  cell?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  loadingTrigger?: TableFetchTrigger | null
  emptyMessage?: string
  getRowKey?: (row: T, index: number) => string
  entityName?: string
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  loadingTrigger,
  emptyMessage = "No results found.",
  getRowKey,
  entityName = "items",
}: DataTableProps<T>) {
  const showOverlay = isLoading && data.length > 0
  const showInitialLoader = isLoading && data.length === 0

  const loadingLabel =
    loadingTrigger === "search"
      ? "Searching..."
      : loadingTrigger === "pagination"
        ? "Loading page..."
        : loadingTrigger === "sort"
          ? "Applying sort..."
          : loadingTrigger === "filter"
            ? "Applying filters..."
            : loadingTrigger === "limit"
              ? "Updating page size..."
              : "Loading users..."

  return (
    <div className="relative w-full overflow-hidden border border-border bg-card shadow-sm">
      <TableFetchOverlay isVisible={!!showOverlay} trigger={loadingTrigger} />

      <motion.div
        animate={{ opacity: isLoading && data.length > 0 ? 0.55 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                {columns.map((col, i) => (
                  <TableHead key={i} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {showInitialLoader ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs font-medium">{loadingLabel}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, i) => (
                  <TableRow
                    key={getRowKey ? getRowKey(row, i) : i}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {columns.map((col, j) => (
                      <TableCell key={j} className={col.className}>
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                            ? String(
                                (row as Record<string, unknown>)[col.accessorKey as string] ??
                                  "-"
                              )
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
      <div className="flex items-center justify-between border-t border-border bg-card/50 px-4 py-2.5 select-none">
        <span className="text-xs text-muted-foreground">
          Showing {data.length} of {data.length} {entityName}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-7 px-3 text-xs font-medium cursor-not-allowed text-muted-foreground/40 border-border bg-transparent"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-7 px-3 text-xs font-medium cursor-not-allowed text-muted-foreground/40 border-border bg-transparent"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
