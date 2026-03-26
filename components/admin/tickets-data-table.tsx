'use client'

import { DataTable } from '@/components/ui/data-table'
import type { DataTableTicket } from '@/components/ui/data-table'

interface AdminTicketsDataTableProps {
  tickets: DataTableTicket[]
}

export function AdminTicketsDataTable({ tickets }: AdminTicketsDataTableProps) {
  return (
    <DataTable
      tickets={tickets}
      detailBasePath="/admin/tickets"
      pageSize={10}
      showReporter
      searchPlaceholder="ค้นหา"
      emptyText="ไม่พบรายการแจ้งซ่อม"
    />
  )
}
