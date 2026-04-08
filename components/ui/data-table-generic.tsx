'use client'

import * as React from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type RowSelectionState,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  emptyMessage?: string
  selectableRows?: boolean
  getRowId?: (row: TData, index: number) => string
  onDeleteSelectedRows?: (rows: TData[]) => Promise<void> | void
  deleteSelectedTitle?: string
  deleteSelectedDescription?: (count: number) => string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = 'ไม่พบข้อมูล',
  selectableRows = false,
  getRowId,
  onDeleteSelectedRows,
  deleteSelectedTitle = 'ยืนยันการลบรายการที่เลือก',
  deleteSelectedDescription,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeletingSelectedRows, setIsDeletingSelectedRows] = React.useState(false)

  const columnsWithSelection = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!selectableRows) {
      return columns
    }

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    }

    return [selectionColumn, ...columns]
  }, [columns, selectableRows])

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: selectableRows,
    state: {
      sorting,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
  const selectedCount = selectedRows.length

  const handleDeleteSelectedRows = async () => {
    if (!onDeleteSelectedRows || selectedCount === 0) return

    setIsDeletingSelectedRows(true)

    try {
      await onDeleteSelectedRows(selectedRows)
      setRowSelection({})
      setDeleteDialogOpen(false)
    } finally {
      setIsDeletingSelectedRows(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-t-md">
      {selectableRows && onDeleteSelectedRows ? (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            เลือกแล้ว {table.getFilteredSelectedRowModel().rows.length} รายการ
          </p>
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedCount === 0}
            onClick={() => setDeleteDialogOpen(true)}
          >
            ลบรายการที่เลือก ({selectedCount})
          </Button>
        </div>
      ) : null}

      <Table className="w-full table-fixed">
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="text-muted-foreground"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-muted-foreground py-12 text-center"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          ทั้งหมด {table.getFilteredRowModel().rows.length} รายการ
        </p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            หน้า {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft />
            <span className="sr-only">หน้าก่อนหน้า</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight />
            <span className="sr-only">หน้าถัดไป</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteSelectedTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSelectedDescription
                ? deleteSelectedDescription(selectedCount)
                : `คุณกำลังจะลบ ${selectedCount} รายการ การกระทำนี้ไม่สามารถยกเลิกได้`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSelectedRows}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingSelectedRows || selectedCount === 0}
              onClick={handleDeleteSelectedRows}
            >
              {isDeletingSelectedRows ? 'กำลังลบ...' : 'ยืนยันการลบ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
