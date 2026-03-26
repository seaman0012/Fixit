'use client'

import { DataTable } from '@/components/ui/data-table'
import type { TicketWithProfile } from '@/types'

type ResidentTicketRow = TicketWithProfile & {
  rooms?: {
    room_number: string
  } | null
}

interface RecentTicketsTableProps {
  tickets: ResidentTicketRow[]
}

export function RecentTicketsTable({ tickets }: RecentTicketsTableProps) {
  return (
    <DataTable
      tickets={tickets}
      detailBasePath="/resident/tickets"
      pageSize={5}
      showSearch={false}
      emptyText="ไม่พบรายการ"
    />
  )
}
