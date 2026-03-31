import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import type { DataTableTicket } from '@/components/ui/data-table'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function TicketsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: tickets } = await supabase
    .from('tickets')
    .select(
      `
      *,
      rooms:room_id (
        room_number
      ),
      categories:category_id (
        name
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const tableTickets: DataTableTicket[] = (tickets ?? [])
    .filter(
      (ticket): ticket is typeof ticket & { created_at: string } => ticket.created_at !== null
    )
    .map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      status: ticket.status,
      created_at: ticket.created_at,
      categories: ticket.categories,
      rooms: ticket.rooms,
    }))

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">รายการแจ้งซ่อม</CardTitle>
          <CardDescription className="text-muted-foreground">
            ติดตามสถานะและดูรายละเอียดการแจ้งซ่อม
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            tickets={tableTickets}
            detailBasePath="/resident/tickets"
            pageSize={10}
            showSearch
            showPagination
            showStatusFilter
            showViewAllButton={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
