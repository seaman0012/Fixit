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
import { format } from 'date-fns'
import { useDebounce } from 'use-debounce'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react'

import { categoryConfig, statusConfig } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type DataTableTicket = {
  id: string
  title: string
  description: string | null
  category: string | null
  status: string
  created_at: string
  categories?: {
    name: string
  } | null
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
  showPagination?: boolean
  showStatusFilter?: boolean
  showViewAllButton?: boolean
  showStatusCountBadges?: boolean
}

export function DataTable({
  tickets,
  detailBasePath,
  pageSize = 10,
  showReporter = false,
  showSearch = true,
  showPagination = true,
  showStatusFilter = true,
  showViewAllButton = true,
  showStatusCountBadges = false,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)

  const searchedTickets = React.useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase()

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
  }, [tickets, debouncedSearchQuery])

  const columns = React.useMemo<ColumnDef<DataTableTicket>[]>(() => {
    const baseColumns: ColumnDef<DataTableTicket>[] = [
      {
        accessorKey: 'title',
        size: 300,
        header: 'หัวข้อ',
        cell: ({ row }) => (
          <div className="flex w-full flex-col gap-1 pl-2">
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
        size: 120,
        header: 'หมวดหมู่',
        cell: ({ row }) => {
          const categoryKey = row.original.categories?.name || row.original.category
          const categoryLabel = categoryKey
            ? categoryConfig[categoryKey as keyof typeof categoryConfig]
            : 'N/A'
          return (
            <Badge variant="outline" className="px-1.5">
              {categoryLabel}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'status',
        size: 120,
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
          const statusValue = row.original.status

          return (
            <Badge variant="outline" className="px-1.5">
              {statusValue === 'completed' ? (
                <StatusIcon className="dark:text-background size-3 fill-green-500 text-white dark:fill-green-400" />
              ) : statusValue === 'cancelled' ? (
                <StatusIcon className="dark:text-background size-3 fill-red-500 text-white dark:fill-red-400" />
              ) : statusValue === 'in_progress' ? (
                <StatusIcon className="size-3 text-blue-500 dark:text-blue-400" />
              ) : (
                <StatusIcon className="size-3" />
              )}
              {status.label}
            </Badge>
          )
        },
      },
      {
        id: 'room',
        size: 80,
        header: 'ห้อง',
        cell: ({ row }) => <span>{row.original.rooms?.room_number || '-'}</span>,
      },
      {
        accessorKey: 'created_at',
        size: 120,
        header: ({ column }) => {
          const sorted = column.getIsSorted()

          return (
            <button
              type="button"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="inline-flex items-center gap-2 font-medium"
            >
              วันที่
              {sorted === 'asc' ? (
                <ArrowUp className="size-3" />
              ) : sorted === 'desc' ? (
                <ArrowDown className="size-3" />
              ) : (
                <ArrowUp className="size-3" />
              )}
            </button>
          )
        },
        cell: ({ row }) => <span>{format(new Date(row.original.created_at), 'PP')}</span>,
      },
    ]

    if (showReporter) {
      baseColumns.splice(3, 0, {
        id: 'reporter',
        header: () => <div className="text-muted-foreground w-full text-left">ผู้แจ้ง</div>,
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

  const tableData = React.useMemo(() => {
    return showPagination ? searchedTickets : searchedTickets.slice(0, pageSize)
  }, [searchedTickets, showPagination, pageSize])

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    initialState: showPagination
      ? {
          pagination: {
            pageSize,
          },
        }
      : undefined,
    state: {
      sorting,
      columnFilters,
    },
  })

  const statusFilterValue = (table.getColumn('status')?.getFilterValue() as string) ?? 'all'
  const statusCounts = React.useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc.all += 1
        if (ticket.status === 'pending') acc.pending += 1
        if (ticket.status === 'in_progress') acc.inProgress += 1
        if (ticket.status === 'completed') acc.completed += 1
        if (ticket.status === 'cancelled') acc.cancelled += 1
        return acc
      },
      { all: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 }
    )
  }, [tickets])

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 pb-4 md:flex-row-reverse md:items-center">
        <div className="flex flex-1 items-center gap-2">
          {showStatusFilter ? (
            <div className="md:place ml-auto w-full md:max-w-xl">
              <Select
                value={statusFilterValue}
                onValueChange={(value) => table.getColumn('status')?.setFilterValue(value)}
              >
                <SelectTrigger className="flex w-fit md:hidden" size="sm">
                  <SelectValue placeholder="กรองสถานะ" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Tabs
                value={statusFilterValue}
                onValueChange={(value) => table.getColumn('status')?.setFilterValue(value)}
                className="hidden md:flex md:w-full"
              >
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="all" className="w-full gap-1">
                    <span>ทั้งหมด</span>
                  </TabsTrigger>
                  <TabsTrigger className="w-full gap-1" value="pending">
                    <span>รอดำเนินการ</span>
                    {showStatusCountBadges ? (
                      <Badge variant="ghost">{statusCounts.pending}</Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger className="w-full gap-1" value="in_progress">
                    <span>ดำเนินการ</span>
                    {showStatusCountBadges ? (
                      <Badge variant="ghost">{statusCounts.inProgress}</Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger className="w-full gap-1" value="completed">
                    <span>เสร็จสิ้น</span>
                    {showStatusCountBadges ? (
                      <Badge variant="ghost">{statusCounts.completed}</Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger className="w-full gap-1" value="cancelled">
                    <span>ยกเลิก</span>
                    {showStatusCountBadges ? (
                      <Badge variant="ghost">{statusCounts.cancelled}</Badge>
                    ) : null}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          ) : null}
        </div>
        {showSearch ? (
          <InputGroup className="w-full max-w-xs items-center">
            <InputGroupInput
              placeholder="ค้นหา..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <InputGroupAddon id="inline-start" className="pointer-events-none">
              <Search className="text-muted-foreground size-4" />
            </InputGroupAddon>
          </InputGroup>
        ) : null}
        {showViewAllButton ? (
          <Link className="flex shrink-0 self-end md:ml-auto md:self-auto" href={detailBasePath}>
            <Button variant="outline" size="sm">
              ดูทั้งหมด
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-t-md">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  ไม่พบรายการแจ้งซ่อม
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination ? (
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
      ) : (
        <div className="text-muted-foreground py-4 text-sm">
          ทั้งหมด {table.getFilteredRowModel().rows.length} รายการ
        </div>
      )}
    </div>
  )
}
