'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { Send, Loader2 } from 'lucide-react'
import type { CommentWithProfile } from '@/types'

interface CommentSectionProps {
  ticketId: string
  initialComments: CommentWithProfile[]
  /**
   * User role: 'admin' or 'resident'
   * Used to customize the description text
   */
  userRole?: 'admin' | 'resident'
}

export default function CommentSection({
  ticketId,
  initialComments,
  userRole = 'resident',
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithProfile[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Real-time subscription
  useEffect(() => {
    // Set initial comments
    setComments(initialComments)

    const channel = supabase
      .channel(`comments:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          console.log('New comment received via Realtime:', payload)

          // Fetch the full comment with profile data
          const { data: newComment } = await supabase
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
            .eq('id', payload.new.id)
            .single()

          if (newComment) {
            // ตรวจสอบว่ามี comment นี้อยู่แล้วหรือไม่ (เพื่อป้องกัน duplicate จาก optimistic update)
            // Ensure created_at is a string for serialization
            const serializedComment: CommentWithProfile = {
              ...newComment,
              created_at:
                typeof newComment.created_at === 'string'
                  ? newComment.created_at
                  : newComment.created_at
                    ? new Date(newComment.created_at).toISOString()
                    : new Date().toISOString(),
            }
            setComments((prev) => {
              const exists = prev.some((c) => c.id === serializedComment.id)
              if (exists) return prev
              return [...prev, serializedComment]
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId, supabase, initialComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Insert comment และดึงข้อมูลที่เพิ่งสร้างกลับมาพร้อม profile
      const { data: insertedComment, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message: newComment.trim(),
        })
        .select(
          `
          *,
          profiles (
            full_name,
            role
          )
        `
        )
        .single()

      if (error) throw error

      // อัปเดต UI ทันทีด้วย optimistic update
      if (insertedComment) {
        const serializedComment: CommentWithProfile = {
          ...insertedComment,
          created_at:
            typeof insertedComment.created_at === 'string'
              ? insertedComment.created_at
              : insertedComment.created_at
                ? new Date(insertedComment.created_at).toISOString()
                : new Date().toISOString(),
        }
        setComments((prev) => [...prev, serializedComment])
      }

      setNewComment('')
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const description =
    userRole === 'admin'
      ? 'พูดคุยและให้ข้อมูลเพิ่มเติมกับผู้พักอาศัย'
      : 'พูดคุยและให้ข้อมูลเพิ่มเติมกับผู้ดูแลหอพัก'

  return (
    <Card>
      <CardHeader>
        <CardTitle>การสนทนา</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">ยังไม่มีความคิดเห็น</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {comment.profiles ? getInitials(comment.profiles.full_name) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {comment.profiles?.full_name || 'Unknown'}
                    </p>
                    {comment.profiles?.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">
                        ผู้ดูแล
                      </Badge>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(comment.created_at!), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {comment.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="เขียนความคิดเห็น..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !newComment.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  ส่งความคิดเห็น
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
