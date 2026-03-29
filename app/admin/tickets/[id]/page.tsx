import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle2, MapPin, User, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import Image from 'next/image'
import CommentSection from '@/components/resident/comment-section'
import StatusUpdateForm from '@/components/admin/status-update-form'
import { statusConfig, categoryConfig } from '@/lib/constants'
import type { AdminTicketWithProfile, CommentWithProfile } from '@/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: ticket } = (await supabase
    .from('tickets')
    .select('title, description, status')
    .eq('id', id)
    .single()) as { data: any; error: any }

  if (!ticket) {
    return {
      title: 'ไม่พบรายการ',
    }
  }

  const statusLabel =
    statusConfig[ticket.status as keyof typeof statusConfig]?.label || ticket.status

  return {
    title: `${ticket.title} - Fixit Admin`,
    description: `${ticket.description?.substring(0, 150)}... | สถานะ: ${statusLabel}`,
    openGraph: {
      title: ticket.title,
      description: ticket.description?.substring(0, 150),
      type: 'article',
      siteName: 'Fixit',
    },
  }
}

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // ดึงข้อมูล ticket
  const { data: ticket, error } = (await supabase
    .from('tickets')
    .select(
      `
      *,
      rooms:room_id (
        room_number
      ),
      profiles:user_id (
        full_name,
        email,
        phone
      )
    `
    )
    .eq('id', id)
    .single()) as { data: AdminTicketWithProfile; error: any }

  if (error || !ticket) {
    notFound()
  }

  // ดึงข้อมูล comments
  const { data: commentsRaw } = await supabase
    .from('ticket_comments')
    .select(
      `
      *,
      profiles (
        full_name,
        role
      )
    `
    )
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  // Serialize comments to ensure created_at is a string (not Date object)
  const comments = (commentsRaw || []).map((comment: any) => ({
    ...comment,
    created_at:
      typeof comment.created_at === 'string'
        ? comment.created_at
        : new Date(comment.created_at).toISOString(),
  })) as CommentWithProfile[]

  const status = statusConfig[ticket.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="bg-card relative overflow-hidden rounded-2xl border px-5 py-5 sm:px-6">
        <div className="absolute inset-x-0 top-0 h-1" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{ticket.title}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              จัดการข้อมูลและอัปเดตสถานะรายการแจ้งซ่อม
            </p>
          </div>
          <Badge className={status.color}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>รายละเอียด</CardTitle>
                  <CardDescription>
                    สร้างเมื่อ{' '}
                    {format(new Date(ticket.created_at!), 'd MMMM yyyy, HH:mm น.', { locale: th })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <h3 className="mb-2 font-medium">คำอธิบาย</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {ticket.image_urls && ticket.image_urls.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium">รูปภาพประกอบ</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {ticket.image_urls.map((url: string, index: number) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square overflow-hidden rounded-xl border"
                      >
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover transition-transform hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <StatusUpdateForm ticket={ticket} />

          <CommentSection ticketId={id} initialComments={comments} userRole="admin" />
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">ผู้แจ้ง</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <User className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">ชื่อ</p>
                  <p className="text-muted-foreground text-sm">
                    {ticket.profiles?.full_name || 'Unknown'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <MapPin className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">หมายเลขห้อง</p>
                  <p className="text-muted-foreground text-sm">
                    {ticket.rooms?.room_number || '-'}
                  </p>
                </div>
              </div>

              {ticket.profiles?.phone && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Phone className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">เบอร์โทรศัพท์</p>
                      <p className="text-muted-foreground text-sm">{ticket.profiles.phone}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">ข้อมูลเพิ่มเติม</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">ประเภท</p>
                  <p className="text-muted-foreground text-sm">
                    {categoryConfig[ticket.category as keyof typeof categoryConfig]}
                  </p>
                </div>
              </div>

              <Separator />

              {ticket.completed_at && (
                <>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">เสร็จสิ้นเมื่อ</p>
                      <p className="text-muted-foreground text-sm">
                        {format(new Date(ticket.completed_at), 'd MMMM yyyy, HH:mm น.', {
                          locale: th,
                        })}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
