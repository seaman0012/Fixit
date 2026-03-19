import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, AlertCircle, CheckCircle2, MapPin, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import Image from 'next/image'
import CommentSection from '@/components/resident/comment-section'
import { statusConfig, categoryConfig } from '@/lib/constants'
import type { TicketWithProfile, CommentWithProfile } from '@/types'

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
    title: `${ticket.title} - Fixit`,
    description: `${ticket.description?.substring(0, 150)}... | สถานะ: ${statusLabel}`,
    openGraph: {
      title: ticket.title,
      description: ticket.description?.substring(0, 150),
      type: 'article',
      siteName: 'Fixit',
    },
  }
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ดึงข้อมูล ticket
  const { data: ticket, error } = (await supabase
    .from('tickets')
    .select(
      `
      *,
      profiles:user_id (
        full_name,
        email
      )
    `
    )
    .eq('id', id)
    .single()) as { data: TicketWithProfile; error: any }

  if (error || !ticket) {
    notFound()
  }

  // ตรวจสอบว่าเป็นเจ้าของ ticket หรือไม่
  if (ticket.user_id !== user.id) {
    redirect('/resident')
  }

  // ดึงข้อมูล comments
  const { data: commentsRaw } = await supabase
    .from('comments')
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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{(ticket as any).title}</h1>
        <p className="text-muted-foreground">รายละเอียดการแจ้งซ่อม</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>รายละเอียด</CardTitle>
                  <CardDescription>
                    สร้างเมื่อ{' '}
                    {format(new Date(ticket.created_at!), 'd MMMM yyyy, HH:mm น.', {
                      locale: th,
                    })}
                  </CardDescription>
                </div>
                <Badge className={status.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        className="relative aspect-square overflow-hidden rounded-lg border"
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

          {/* Comments */}
          <CommentSection ticketId={id} initialComments={comments} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ข้อมูลเพิ่มเติม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">หมายเลขห้อง</p>
                  <p className="text-muted-foreground text-sm">{(ticket as any).room_number}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <AlertCircle className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">ประเภท</p>
                  <p className="text-muted-foreground text-sm">
                    {categoryConfig[(ticket as any).category as keyof typeof categoryConfig]}
                  </p>
                </div>
              </div>

              <Separator />

              {ticket.completed_at && (
                <>
                  <Separator />
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

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ไทม์ไลน์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                    <Calendar className="text-primary-foreground h-4 w-4" />
                  </div>
                  <div className="bg-border w-px flex-1" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">สร้างรายการ</p>
                  <p className="text-muted-foreground text-xs">
                    {format(new Date(ticket.created_at!), 'd MMM yyyy, HH:mm', { locale: th })}
                  </p>
                </div>
              </div>

              {ticket.status !== 'pending' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    {ticket.status !== 'in_progress' && <div className="bg-border w-px flex-1" />}
                  </div>
                  <div className={ticket.status === 'in_progress' ? '' : 'pb-4'}>
                    <p className="text-sm font-medium">เริ่มดำเนินการ</p>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(ticket.updated_at!), 'd MMM yyyy, HH:mm', { locale: th })}
                    </p>
                  </div>
                </div>
              )}

              {ticket.completed_at && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">เสร็จสิ้น</p>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(ticket.completed_at), 'd MMM yyyy, HH:mm', { locale: th })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
