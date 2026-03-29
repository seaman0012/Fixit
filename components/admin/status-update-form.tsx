'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Loader2, Save } from 'lucide-react'

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
}

export default function StatusUpdateForm({ ticket }: StatusUpdateFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState(ticket.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleUpdate = async () => {
    if (status === ticket.status) {
      setError('สถานะไม่มีการเปลี่ยนแปลง')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const supabase = createClient()

      const updateData: any = {
        status,
      }

      // ถ้าเปลี่ยนเป็น completed ให้เพิ่ม completed_at
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase.from('tickets').update(updateData).eq('id', ticket.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>อัปเดตสถานะ</CardTitle>
        <CardDescription>เปลี่ยนสถานะของรายการแจ้งซ่อมตามความคืบหน้า</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
            อัปเดตสถานะสำเร็จ!
          </div>
        )}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="status">สถานะ</FieldLabel>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
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
              disabled={loading || status === ticket.status}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  กำลังอัปเดต...
                </>
              ) : (
                <>
                  <Save data-icon="inline-start" />
                  บันทึกการเปลี่ยนแปลง
                </>
              )}
            </Button>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
