import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle2, MapPin, User, Phone, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import Image from 'next/image'
import CommentSection from '@/components/resident/comment-section'
import StatusUpdateForm from '@/components/admin/status-update-form'
import { statusConfig, categoryConfig } from '@/lib/constants'
import type { AdminTicketWithProfile, CommentWithProfile } from '@/types'
import { TZDate } from '@date-fns/tz'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profileQuery = user?.id
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const profileData = profileQuery.data

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
      ),
      categories:category_id (
        name
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
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader className="gap-4">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{ticket.title}</h1>
              <CardTitle>รายละเอียด</CardTitle>
              <CardDescription>
                สร้างเมื่อ{' '}
                {format(new TZDate(ticket.created_at!, 'Asia/Bangkok'), 'd MMMM yyyy, HH:mm', {
                  locale: th,
                })}
              </CardDescription>
              <CardAction>
                <Badge variant="outline" className="text-muted-foreground">
                  <StatusIcon className={status.color} />
                  {status.label}
                </Badge>
              </CardAction>
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

          <StatusUpdateForm ticket={ticket} readOnly={profileData?.role === 'owner'} />

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
                    {categoryConfig[
                      ((ticket as any).categories?.name ||
                        (ticket as any).category) as keyof typeof categoryConfig
                    ] || 'N/A'}
                  </p>
                </div>
              </div>

              {ticket.completed_at && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">เสร็จสิ้นเมื่อ</p>
                      <p className="text-muted-foreground text-sm">
                        {format(
                          new TZDate(ticket.completed_at, 'Asia/Bangkok'),
                          'd MMMM yyyy, HH:mm',
                          { locale: th }
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ไทม์ไลน์</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                    <Calendar className="text-primary-foreground h-4 w-4" />
                  </div>
                  <div className="bg-primary/20 h-6 w-0.5 flex-auto" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">สร้างรายการ</p>
                  <p className="text-muted-foreground text-xs">
                    {format(new TZDate(ticket.created_at!, 'Asia/Bangkok'), 'd MMMM yyyy, HH:mm', {
                      locale: th,
                    })}
                  </p>
                </div>
              </div>

              {ticket.status !== 'pending' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    {ticket.status !== 'in_progress' && (
                      <div className="bg-primary/20 h-6 w-0.5 flex-auto" />
                    )}
                  </div>
                  <div className={ticket.status === 'in_progress' ? '' : 'pb-4'}>
                    <p className="text-sm font-medium">เริ่มดำเนินการ</p>
                    <p className="text-muted-foreground text-xs">
                      {format(
                        new TZDate(ticket.updated_at!, 'Asia/Bangkok'),
                        'd MMMM yyyy, HH:mm',
                        { locale: th }
                      )}
                    </p>
                  </div>
                </div>
              )}

              {ticket.completed_at && (
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">เสร็จสิ้น</p>
                    <p className="text-muted-foreground text-xs">
                      {format(
                        new TZDate(ticket.completed_at, 'Asia/Bangkok'),
                        'd MMMM yyyy, HH:mm',
                        { locale: th }
                      )}
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
