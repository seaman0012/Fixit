'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field'
import { categoryConfig } from '@/lib/constants'

type CategoryOption = {
  id: string
  name: string
}

function getCategoryLabel(categoryName: string) {
  return categoryConfig[categoryName as keyof typeof categoryConfig] ?? categoryName
}

export default function NewTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [roomLoading, setRoomLoading] = useState(true)
  const [categoryLoading, setCategoryLoading] = useState(true)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [residentRoomId, setResidentRoomId] = useState('')
  const [error, setError] = useState('')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdTicketId, setCreatedTicketId] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    roomNumber: '',
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    const loadResidentRoom = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('กรุณาเข้าสู่ระบบ')
          return
        }

        const { data: profile, error: profileError } = (await supabase
          .from('profiles')
          .select(
            `
            room_id,
            rooms:room_id (
              room_number
            )
          `
          )
          .eq('id', user.id)
          .single()) as { data: any; error: any }

        if (profileError) throw profileError

        if (!profile?.room_id || !profile?.rooms?.room_number) {
          setError('ไม่พบข้อมูลหมายเลขห้อง กรุณาติดต่อเจ้าหน้าที่')
          return
        }

        setResidentRoomId(profile.room_id)
        setFormData((prev) => ({ ...prev, roomNumber: profile.rooms.room_number }))
      } catch {
        setError('ไม่สามารถโหลดข้อมูลหมายเลขห้องได้ กรุณาลองใหม่อีกครั้ง')
      } finally {
        setRoomLoading(false)
      }
    }

    loadResidentRoom()
  }, [])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const supabase = createClient()
        const categoryClient = supabase as any
        const { data, error } = await categoryClient
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true })

        if (error) throw error

        setCategoryOptions((data ?? []) as CategoryOption[])
      } catch {
        setError('ไม่สามารถโหลดประเภทการแจ้งซ่อมได้ กรุณาลองใหม่อีกครั้ง')
      } finally {
        setCategoryLoading(false)
      }
    }

    loadCategories()
  }, [])

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

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.title || !formData.description || !formData.categoryId) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      setLoading(false)
      return
    }

    if (categoryLoading) {
      setError('กำลังโหลดประเภทการแจ้งซ่อม กรุณาลองอีกครั้ง')
      setLoading(false)
      return
    }

    if (roomLoading) {
      setError('กำลังโหลดหมายเลขห้อง กรุณาลองอีกครั้ง')
      setLoading(false)
      return
    }

    if (!residentRoomId) {
      setError('ไม่พบข้อมูลหมายเลขห้อง กรุณาติดต่อเจ้าหน้าที่')
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
          category_id: formData.categoryId,
          room_id: residentRoomId,
          image_urls: imageUrls,
          status: 'pending',
        } as any)
        .select()
        .single()) as { data: any; error: any }

      if (error) throw error

      try {
        const notifyResponse = await fetch('/api/line/notify-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ticketId: data.id }),
        })

        if (!notifyResponse.ok) {
          const notifyBody = await notifyResponse.json().catch(() => null)
          console.error('LINE notify failed', {
            status: notifyResponse.status,
            body: notifyBody,
          })
        }
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
    setFormData((prev) => ({
      ...prev,
      title: '',
      description: '',
      categoryId: '',
    }))
    setImageFiles([])
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setPreviewUrls([])
    setShowSuccessDialog(false)
    setCreatedTicketId('')
    setError('')
  }

  const handleSuccessDialogOpenChange = (open: boolean) => {
    setShowSuccessDialog(open)

    if (!open) {
      router.push('/resident')
      router.refresh()
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card className="rounded-2xl">
        <CardHeader className="gap-1">
          <CardTitle>ข้อมูลการแจ้งซ่อม</CardTitle>
          <CardDescription>
            กรุณากรอกข้อมูลให้ครบถ้วนและชัดเจนเพื่อความรวดเร็วในการดำเนินการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error ? (
              <div
                role="alert"
                className="bg-destructive/10 text-destructive rounded-md p-3 text-sm"
              >
                {error}
              </div>
            ) : null}
            <FieldGroup>
              <FieldSet>
                <Field>
                  <FieldLabel htmlFor="roomNumber">หมายเลขห้อง</FieldLabel>
                  <Input
                    id="roomNumber"
                    value={roomLoading ? 'กำลังโหลด...' : formData.roomNumber}
                    readOnly
                    disabled={roomLoading}
                    className="text-muted-foreground"
                  />
                  <FieldDescription className="text-muted-foreground mt-1 text-xs">
                    ดึงจากข้อมูลผู้พักอาศัยอัตโนมัติ
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="category">
                    ประเภท <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    disabled={categoryLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          categoryLoading ? 'กำลังโหลดประเภทการแจ้งซ่อม...' : 'เลือกประเภทอุปกรณ์'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {getCategoryLabel(option.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription className="text-muted-foreground mt-1 text-xs">
                    เลือกประเภทจากรายการจริงในระบบ
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="title">
                    หัวข้อ <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="title"
                    placeholder="เช่น แอร์ไม่เย็น, ไฟในห้องน้ำไม่ติด"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">
                    รายละเอียด <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="อธิบายปัญหาที่พบโดยละเอียด..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Field>
              </FieldSet>

              <FieldSeparator />

              <Field>
                <FieldLabel htmlFor="images">
                  รูปภาพประกอบ <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldDescription className="text-muted-foreground mt-1 text-xs">
                  ไฟล์รูปภาพขนาดไม่เกิน 5MB (จำเป็นต้องแนบอย่างน้อย 1 รูป)
                </FieldDescription>
                <div className="bg-muted/20 flex flex-col gap-4 rounded-xl border border-dashed p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-fit"
                      onClick={() => document.getElementById('images')?.click()}
                    >
                      <Upload data-icon="inline-start" />
                      อัปโหลดรูปภาพ
                    </Button>
                  </div>
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />

                  {previewUrls.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {previewUrls.map((url, index) => (
                        <div key={url} className="relative aspect-square">
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
                            <X />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Field>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="submit"
                  disabled={loading || uploading || roomLoading || categoryLoading}
                  className="w-full sm:flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                      กำลังอัปโหลดรูปภาพ...
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                      กำลังสร้างรายการ...
                    </>
                  ) : (
                    'สร้างรายการแจ้งซ่อม'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => router.back()}
                  disabled={loading || uploading}
                >
                  ยกเลิก
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showSuccessDialog} onOpenChange={handleSuccessDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
              <CheckCircle2 className="size-8 text-green-500 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center">สร้างรายการแจ้งซ่อมสำเร็จ!</DialogTitle>
            <DialogDescription className="text-center">
              ระบบได้รับเรื่องแจ้งซ่อมของคุณเรียบร้อยแล้ว
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-4 sm:flex-col">
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
