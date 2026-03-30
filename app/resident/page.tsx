import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
  CardFooter,
  CardContent,
} from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import Link from 'next/link'
import { Plus, Clock, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import type { DataTableTicket } from '@/components/ui/data-table'

export default async function ResidentPage() {
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
      rooms: ticket.rooms,
    }))

  const totalTickets = tickets?.length || 0
  const pendingCount = tickets?.filter((t: any) => t.status === 'pending').length || 0
  const inProgressCount = tickets?.filter((t: any) => t.status === 'in_progress').length || 0
  const completedCount = tickets?.filter((t: any) => t.status === 'completed').length || 0

  return (
    <div className="@container/main flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">หน้าหลัก</h1>
        </div>
        <Link href="/resident/tickets/new">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            แจ้งซ่อม
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="*:from-primary/5 *:to-card grid grid-cols-1 gap-4 *:bg-linear-to-t *:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>ทั้งหมด</CardDescription>
            <CardTitle className="text-3xl font-semibold">{totalTickets}</CardTitle>
            <CardAction>
              <FileText className="h-4 w-4" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">รายการทั้งหมด</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>รอดำเนินการ</CardDescription>
            <CardTitle className="text-3xl font-semibold">{pendingCount}</CardTitle>
            <CardAction>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">รายการที่รอการตรวจสอบ</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>กำลังดำเนินการ</CardDescription>
            <CardTitle className="text-3xl font-semibold">{inProgressCount}</CardTitle>
            <CardAction>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">รายการที่กำลังดำเนินการ</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>เสร็จสิ้น</CardDescription>
            <CardTitle className="text-3xl font-semibold">{completedCount}</CardTitle>
            <CardAction>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">รายการที่เสร็จสิ้น</p>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Tickets */}
      <section className="flex flex-col">
        {tickets && tickets.length > 0 ? (
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-2xl">
                รายการแจ้งซ่อมล่าสุด
                <div className="text-muted-foreground text-sm font-normal">5 รายการล่าสุด</div>
              </CardTitle>
              <CardAction>
                <Link
                  className="flex shrink-0 self-end md:ml-auto md:self-auto"
                  href="/resident/tickets"
                >
                  <Button variant="outline" size="sm">
                    ดูทั้งหมด
                  </Button>
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              <DataTable
                tickets={tableTickets}
                detailBasePath="/resident/tickets"
                pageSize={5}
                showSearch={false}
                showPagination={false}
                showStatusFilter={false}
                showViewAllButton={false}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">ยังไม่มีรายการแจ้งซ่อม</p>
            <Link href="/resident/tickets/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                แจ้งซ่อมรายการแรก
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
