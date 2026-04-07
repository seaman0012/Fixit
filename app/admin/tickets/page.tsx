import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DataTableTicket } from '@/components/ui/data-table'
import AdminTicketsRealtime from '@/components/admin/admin-tickets-realtime'

export default async function AdminTicketsPage() {
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('tickets')
    .select(
      `
      *,
      rooms:room_id (
        room_number
      ),
      profiles:user_id (
        full_name,
        phone
      ),
      categories:category_id (
        name
      )
    `
    )
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
      profiles: ticket.profiles,
    }))

  return (
    <div className="@container/main flex flex-col gap-6">
      <h1 className="text-3xl font-bold">รายการทั้งหมด</h1>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">สถานะของรายการทั้งหมด</CardTitle>
          <CardDescription>เลือกหัวข้อรายการเพื่อดูรายละเอียด</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTicketsRealtime initialTickets={tableTickets} />
        </CardContent>
      </Card>
    </div>
  )
}
