'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Save } from 'lucide-react'

const statusOptions = [
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'completed', label: 'เสร็จสิ้น' },
  { value: 'cancelled', label: 'ยกเลิก' },
]

interface StatusUpdateFormProps {
  ticket: {
    id: string
    status: string
  }
  readOnly?: boolean
}

export default function StatusUpdateForm({ ticket, readOnly = false }: StatusUpdateFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState(ticket.status)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    if (status === ticket.status) {
      toast.error('สถานะไม่มีการเปลี่ยนแปลง', { position: 'top-center' })
      return
    }

    setLoading(true)

    const supabase = createClient()
    const updateData: any = {
      status,
    }

    // ถ้าเปลี่ยนเป็น completed ให้เพิ่ม completed_at
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    await toast.promise(
      async () => {
        const { error } = await supabase.from('tickets').update(updateData).eq('id', ticket.id)
        if (error) throw error
      },
      {
        loading: 'กำลังอัปเดตสถานะ...',
        success: 'อัปเดตสถานะสำเร็จ!',
        error: (err: any) => err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
      }
    )

    setLoading(false)
    setTimeout(() => {
      router.refresh()
    }, 800)
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>อัปเดตสถานะ</CardTitle>
        <CardDescription>เปลี่ยนสถานะของรายการแจ้งซ่อมตามความคืบหน้า</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="status">สถานะ</FieldLabel>
            <Select value={status} onValueChange={setStatus} disabled={readOnly}>
              <SelectTrigger id="status" disabled={readOnly}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription className="text-muted-foreground text-xs">
              การเปลี่ยนเป็น &quot;เสร็จสิ้น&quot; จะบันทึกเวลาเสร็จงานอัตโนมัติ
            </FieldDescription>
          </Field>
          <Field>
            <Button
              onClick={handleUpdate}
              disabled={loading || status === ticket.status || readOnly}
              className="w-full"
            >
              <Save data-icon="inline-start" />
              บันทึกการเปลี่ยนแปลง
            </Button>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
