import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { Clock, AlertCircle, CheckCircle2, Filter } from 'lucide-react'
import { statusConfig, categoryConfig } from '@/lib/constants'

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const statusFilter = status || 'all'

  // ดึงข้อมูล tickets
  let query = supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: tickets } = await query

  const renderTickets = (filteredTickets: typeof tickets) => {
    if (!filteredTickets || filteredTickets.length === 0) {
      return <div className="text-muted-foreground py-12 text-center">ไม่พบรายการแจ้งซ่อม</div>
    }

    return (
      <div className="space-y-4">
        {filteredTickets.map((ticket: any) => {
          const status = statusConfig[ticket.status as keyof typeof statusConfig]
          const StatusIcon = status.icon

          return (
            <Link key={ticket.id} href={`/resident/tickets/${ticket.id}`} className="block">
              <div className="hover:bg-muted/50 flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{ticket.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {categoryConfig[ticket.category as keyof typeof categoryConfig]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-sm">{ticket.description}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                      locale: th,
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={status.color}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>
                  <span className="text-muted-foreground text-xs">ห้อง {ticket.room_number}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">รายการแจ้งซ่อม</h1>
        <p className="text-muted-foreground">รายการแจ้งซ่อมทั้งหมด</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการของฉัน</CardTitle>
          <CardDescription>ติดตามสถานะและดูรายละเอียดการแจ้งซ่อม</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={statusFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" asChild>
                <Link href="/resident/tickets?status=all">ทั้งหมด</Link>
              </TabsTrigger>
              <TabsTrigger value="pending" asChild>
                <Link href="/resident/tickets?status=pending">รอดำเนินการ</Link>
              </TabsTrigger>
              <TabsTrigger value="in_progress" asChild>
                <Link href="/resident/tickets?status=in_progress">กำลังดำเนินการ</Link>
              </TabsTrigger>
              <TabsTrigger value="completed" asChild>
                <Link href="/resident/tickets?status=completed">เสร็จสิ้น</Link>
              </TabsTrigger>
              <TabsTrigger value="cancelled" asChild>
                <Link href="/resident/tickets?status=cancelled">ยกเลิก</Link>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={statusFilter} className="mt-6">
              {renderTickets(tickets)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
