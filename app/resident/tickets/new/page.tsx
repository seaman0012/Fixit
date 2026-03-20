'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

const categoryOptions = [
  { value: 'electrical', label: 'ไฟฟ้า' },
  { value: 'plumbing', label: 'ประปา' },
  { value: 'air_conditioning', label: 'เครื่องปรับอากาศ' },
  { value: 'furniture', label: 'เฟอร์นิเจอร์' },
  { value: 'other', label: 'อื่นๆ' },
]

const priorityOptions = [
  { value: 'low', label: 'ต่ำ' },
  { value: 'medium', label: 'ปานกลาง' },
  { value: 'high', label: 'สูง' },
]

export default function NewTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdTicketId, setCreatedTicketId] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    roomNumber: '',
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types and size
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น')
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB')
        return false
      }
      return true
    })

    setImageFiles((prev) => [...prev, ...validFiles])

    // Create preview URLs
    validFiles.forEach((file) => {
      const url = URL.createObjectURL(file)
      setPreviewUrls((prev) => [...prev, url])
    })
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (userId: string) => {
    const supabase = createClient()
    const uploadedUrls: string[] = []

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data, error } = await supabase.storage.from('ticket-images').upload(fileName, file)

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from('ticket-images').getPublicUrl(data.path)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.title || !formData.description || !formData.category || !formData.roomNumber) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      setLoading(false)
      return
    }

    if (imageFiles.length === 0) {
      setError('กรุณาแนบรูปภาพอย่างน้อย 1 รูป')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('กรุณาเข้าสู่ระบบ')

      // Upload images
      setUploading(true)
      const imageUrls = await uploadImages(user.id)
      setUploading(false)

      // Create ticket
      const { data, error } = (await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          room_number: formData.roomNumber,
          image_urls: imageUrls,
          status: 'pending',
        } as any)
        .select()
        .single()) as { data: any; error: any }

      if (error) throw error

      try {
        await fetch('/api/line/notify-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ticketId: data.id }),
        })
      } catch (notifyError) {
        console.error('Failed to notify admins via LINE', notifyError)
      }

      // Show success dialog instead of immediate redirect
      setCreatedTicketId(data.id)
      setShowSuccessDialog(true)
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการสร้างรายการแจ้งซ่อม')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const handleViewTicket = () => {
    if (!createdTicketId) {
      return
    }

    router.push(`/resident/tickets/${createdTicketId}`)
    router.refresh()
  }

  const handleReportAnother = () => {
    // Reset form
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      roomNumber: '',
    })
    setImageFiles([])
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setPreviewUrls([])
    setShowSuccessDialog(false)
    setCreatedTicketId('')
    setError('')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">แจ้งซ่อม</h1>
        <p className="text-muted-foreground">กรอกรายละเอียดการแจ้งซ่อมและแนบรูปภาพประกอบ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการแจ้งซ่อม</CardTitle>
          <CardDescription>
            กรุณากรอกข้อมูลให้ครบถ้วนและชัดเจนเพื่อความรวดเร็วในการดำเนินการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">
                หัวข้อ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="เช่น แอร์ไม่เย็น, ไฟในห้องน้ำไม่ติด"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                ประเภท <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทอุปกรณ์" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">ระดับความเร่งด่วน</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomNumber">
                หมายเลขห้อง <span className="text-destructive">*</span>
              </Label>
              <Input
                id="roomNumber"
                placeholder="เช่น A101"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                รายละเอียด <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="อธิบายปัญหาที่พบโดยละเอียด..."
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">
                รูปภาพประกอบ <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('images')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    อัปโหลดรูปภาพ
                  </Button>
                  <p className="text-muted-foreground text-sm">
                    ไฟล์รูปภาพขนาดไม่เกิน 5MB (จำเป็นต้องแนบอย่างน้อย 1 รูป)
                  </p>
                </div>
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="rounded-lg object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading || uploading} className="flex-1">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังอัปโหลดรูปภาพ...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสร้างรายการ...
                  </>
                ) : (
                  'สร้างรายการแจ้งซ่อม'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading || uploading}
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">สร้างรายการแจ้งซ่อมสำเร็จ!</DialogTitle>
            <DialogDescription className="text-center">
              ระบบได้รับเรื่องแจ้งซ่อมของคุณเรียบร้อยแล้ว
              เจ้าหน้าที่จะดำเนินการตรวจสอบและติดต่อกลับโดยเร็วที่สุด
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleViewTicket} className="w-full" size="lg">
              ดูรายการแจ้งซ่อม
            </Button>
            <Button onClick={handleReportAnother} variant="outline" className="w-full" size="lg">
              แจ้งเรื่องอื่น
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
