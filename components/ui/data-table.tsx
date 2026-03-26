'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { categoryConfig, statusConfig } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type DataTableTicket = {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  created_at: string
  rooms?: {
    room_number: string
  } | null
  profiles?: {
    full_name?: string | null
    phone?: string | null
  } | null
}

interface DataTableProps {
  tickets: DataTableTicket[]
  detailBasePath: string
  pageSize?: number
  showReporter?: boolean
  showSearch?: boolean
  searchPlaceholder?: string
  emptyText?: string
}

export function DataTable({
  tickets,
  detailBasePath,
  pageSize = 10,
  showReporter = false,
  showSearch = true,
  searchPlaceholder = 'ค้นหา...',
  emptyText = 'ไม่พบรายการ',
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [searchQuery, setSearchQuery] = React.useState('')

  const searchedTickets = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return tickets
    }

    return tickets.filter((ticket) => {
      return (
        ticket.title.toLowerCase().includes(query) ||
        (ticket.description || '').toLowerCase().includes(query) ||
        (ticket.rooms?.room_number || '').toLowerCase().includes(query) ||
        (ticket.profiles?.full_name || '').toLowerCase().includes(query) ||
        (ticket.profiles?.phone || '').toLowerCase().includes(query)
      )
    })
  }, [tickets, searchQuery])

  const columns = React.useMemo<ColumnDef<DataTableTicket>[]>(() => {
    const baseColumns: ColumnDef<DataTableTicket>[] = [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            หัวข้อ
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex max-w-96 flex-col gap-1">
            <Link
              href={`${detailBasePath}/${row.original.id}`}
              className="font-medium hover:underline"
            >
              {row.original.title}
            </Link>
            <p className="text-muted-foreground truncate text-xs">{row.original.description}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'หมวดหมู่',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {categoryConfig[row.original.category as keyof typeof categoryConfig]}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'สถานะ',
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || filterValue === 'all') {
            return true
          }

          return row.getValue(columnId) === filterValue
        },
        cell: ({ row }) => {
          const status = statusConfig[row.original.status as keyof typeof statusConfig]
          const StatusIcon = status?.icon

          if (!status || !StatusIcon) {
            return (
              <Badge variant="outline" className="w-full justify-center">
                {row.original.status}
              </Badge>
            )
          }

          return (
            <Badge variant="outline" className="">
              <StatusIcon className="mr-1 size-3" />
              {status.label}
            </Badge>
          )
        },
      },
      {
        id: 'room',
        header: 'ห้อง',
        cell: ({ row }) => <span>{row.original.rooms?.room_number || '-'}</span>,
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="ml-auto"
          >
            เวลา
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {formatDistanceToNow(new Date(row.original.created_at), {
              addSuffix: true,
              locale: th,
            })}
          </span>
        ),
      },
    ]

    if (showReporter) {
      baseColumns.splice(3, 0, {
        id: 'reporter',
        header: 'ผู้แจ้ง',
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span>{row.original.profiles?.full_name || 'Unknown'}</span>
            {row.original.profiles?.phone ? (
              <span className="text-muted-foreground text-xs">{row.original.profiles.phone}</span>
            ) : null}
          </div>
        ),
      })
    }

    return baseColumns
  }, [detailBasePath, showReporter])

  const table = useReactTable({
    data: searchedTickets,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        {showSearch ? (
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full md:max-w-sm"
          />
        ) : (
          <div />
        )}
        <div className="flex flex-auto justify-end gap-4">
          <Select
            value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) => table.getColumn('status')?.setFilterValue(value)}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="กรองสถานะ" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Link className="shrink-0" href="/resident/tickets">
            <Button variant="outline">ดูทั้งหมด</Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 py-4">
        <div className="text-muted-foreground text-sm">
          ทั้งหมด {table.getFilteredRowModel().rows.length} รายการ
        </div>
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
    </div>
  )
}
