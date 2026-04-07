'use client'

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table-generic'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Input } from '@/components/ui/input'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  CircleSmall,
  DoorOpen,
  Plus,
  Search,
  SquarePen,
  Trash2,
  UsersRound,
  Wrench,
} from 'lucide-react'

export interface RoomRecord {
  id: string
  roomNumber: string
  floor: string
  status: string
  currentResidentName: string | null
  activeTicketCount: number
  occupantCount: number
}

type RoomFormValues = {
  roomNumber: string
  floor: string
}

type ResidentRecord = {
  id: string
  full_name: string
  room_id: string | null
}

const roomStatusOptions = [
  { value: 'available', label: 'ว่าง' },
  { value: 'occupied', label: 'มีผู้พัก' },
]

function getRoomStatusLabel(status: string) {
  return roomStatusOptions.find((item) => item.value === status)?.label ?? status
}

type SupabaseErrorLike = {
  code?: string
  message?: string
}

function toDeleteErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as SupabaseErrorLike

    if (supabaseError.code === '23503') {
      return 'ไม่สามารถลบห้องได้ เนื่องจากยังมีผู้พักหรือรายการแจ้งซ่อมที่เชื่อมโยงอยู่'
    }

    if (typeof supabaseError.message === 'string' && supabaseError.message.length > 0) {
      return supabaseError.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'ไม่สามารถลบห้องได้'
}

export default function RoomManagementClient({
  initialRooms,
  readOnly = false,
}: {
  initialRooms: RoomRecord[]
  readOnly?: boolean
}) {
  const [rooms, setRooms] = useState<RoomRecord[]>(initialRooms)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  const [selectedFloor, setSelectedFloor] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRoom, setDeletingRoom] = useState<RoomRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [residentOptions, setResidentOptions] = useState<ResidentRecord[]>([])
  const [selectedResident, setSelectedResident] = useState<ResidentRecord | null>(null)
  const [loadingResidents, setLoadingResidents] = useState(false)
  const [showClearWarning, setShowClearWarning] = useState(false)
  const [formValues, setFormValues] = useState<RoomFormValues>({
    roomNumber: '',
    floor: '',
  })

  const floors = useMemo(() => {
    return Array.from(new Set(rooms.map((room) => room.floor))).sort((a, b) => a.localeCompare(b))
  }, [rooms])

  const filteredRooms = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()

    return rooms.filter((room) => {
      const matchSearch =
        query.length === 0 ||
        room.roomNumber.toLowerCase().includes(query) ||
        room.floor.toLowerCase().includes(query) ||
        (room.currentResidentName ?? '').toLowerCase().includes(query)
      const matchFloor = selectedFloor === 'all' || room.floor === selectedFloor
      const matchStatus = selectedStatus === 'all' || room.status === selectedStatus

      return matchSearch && matchFloor && matchStatus
    })
  }, [rooms, debouncedSearch, selectedFloor, selectedStatus])

  const stats = useMemo(() => {
    const total = rooms.length
    const available = rooms.filter((room) => room.status === 'available').length
    const occupied = rooms.filter(
      (room) => room.status === 'occupied' || room.occupantCount > 0
    ).length
    const activeTickets = rooms.reduce((sum, room) => sum + room.activeTicketCount, 0)

    return { total, available, occupied, activeTickets }
  }, [rooms])

  const tableColumns: ColumnDef<RoomRecord>[] = [
    {
      accessorKey: 'roomNumber',
      header: 'เลขห้อง',
      size: 80,
      cell: ({ row }) => <span className="font-medium">{row.original.roomNumber}</span>,
    },
    {
      accessorKey: 'floor',
      header: 'ชั้น',
      size: 60,
    },
    {
      accessorKey: 'currentResidentName',
      header: 'ผู้พักปัจจุบัน',
      size: 250,
      cell: ({ row }) => row.original.currentResidentName ?? '-',
    },
    {
      accessorKey: 'status',
      header: 'สถานะห้อง',
      size: 120,
      cell: ({ row }) =>
        row.original.status === 'available' ? (
          <Badge variant="outline">
            <CircleSmall fill="currentColor" className="text-green-400" data-icon="inline-start" />
            {getRoomStatusLabel(row.original.status)}
          </Badge>
        ) : (
          <Badge variant="outline">
            <CircleSmall fill="currentColor" className="text-blue-500" data-icon="inline-start" />
            {getRoomStatusLabel(row.original.status)}
          </Badge>
        ),
    },
    {
      accessorKey: 'activeTicketCount',
      header: 'งานซ่อมค้าง',
      size: 120,
      cell: ({ row }) =>
        row.original.activeTicketCount > 0 ? (
          <Badge variant="outline">
            <CircleSmall fill="currentColor" className="text-amber-500" data-icon="inline-start" />
            {row.original.activeTicketCount} รายการ
          </Badge>
        ) : (
          <Badge variant="ghost">ไม่มี</Badge>
        ),
    },
    {
      id: 'actions',
      header: 'จัดการ',
      size: 80,
      cell: ({ row }) =>
        readOnly ? null : (
          <div className="flex items-center justify-start gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(row.original)}>
              <SquarePen className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenDeleteDialog(row.original)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
    },
  ]

  const resetForm = () => {
    setEditingRoom(null)
    setFormValues({ roomNumber: '', floor: '' })
    setResidentOptions([])
    setSelectedResident(null)
    setShowClearWarning(false)
  }

  const handleOpenCreateDialog = () => {
    resetForm()
    void loadResidentOptions()
    setDialogOpen(true)
  }

  const loadResidentOptions = async (roomId?: string) => {
    setLoadingResidents(true)
    const supabase = createClient()

    try {
      const query = supabase
        .from('profiles')
        .select('id, full_name, room_id')
        .eq('role', 'resident')
        .order('full_name', { ascending: true })

      const { data, error } = roomId
        ? await query.or(`room_id.is.null,room_id.eq.${roomId}`)
        : await query.is('room_id', null)

      if (error) throw error

      const residents = (data ?? []) as ResidentRecord[]
      setResidentOptions(residents)

      const currentResident = residents.find((resident) => resident.room_id === roomId) ?? null
      setSelectedResident(currentResident)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ไม่สามารถโหลดรายชื่อผู้พักได้'
      toast.error(message)
      setResidentOptions([])
      setSelectedResident(null)
    } finally {
      setLoadingResidents(false)
    }
  }

  const handleOpenEditDialog = (room: RoomRecord) => {
    setEditingRoom(room)
    setFormValues({
      roomNumber: room.roomNumber,
      floor: room.floor,
    })
    setShowClearWarning(false)
    setDialogOpen(true)
    void loadResidentOptions(room.id)
  }

  const handleOpenDeleteDialog = (room: RoomRecord) => {
    setDeletingRoom(room)
    setDeleteDialogOpen(true)
  }

  const handleDeleteRoom = async () => {
    if (!deletingRoom) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      const [residentResult, ticketResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { head: true, count: 'exact' })
          .eq('room_id', deletingRoom.id),
        supabase
          .from('tickets')
          .select('id', { head: true, count: 'exact' })
          .eq('room_id', deletingRoom.id),
      ])

      if (residentResult.error) throw residentResult.error
      if (ticketResult.error) throw ticketResult.error

      if ((residentResult.count ?? 0) > 0 || (ticketResult.count ?? 0) > 0) {
        toast.error('ไม่สามารถลบห้องได้ เนื่องจากยังมีผู้พักหรือรายการแจ้งซ่อมที่เชื่อมโยงอยู่')
        return
      }

      const { error } = await supabase.from('rooms').delete().eq('id', deletingRoom.id)

      if (error) throw error

      setRooms((prev) => prev.filter((room) => room.id !== deletingRoom.id))
      toast.success('ลบห้องเรียบร้อยแล้ว')
    } catch (error) {
      toast.error(toDeleteErrorMessage(error))
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setDeletingRoom(null)
    }
  }

  const handleSaveRoom = async () => {
    if (!formValues.roomNumber.trim() || !formValues.floor.trim()) {
      toast.error('กรุณากรอกเลขห้องและชั้นให้ครบถ้วน')
      return
    }

    setSaving(true)
    const supabase = createClient()

    try {
      if (editingRoom) {
        const selectedResidentId = selectedResident?.id ?? ''
        const nextStatus = selectedResident ? 'occupied' : 'available'

        const clearOccupantsQuery = supabase
          .from('profiles')
          .update({ room_id: null })
          .eq('room_id', editingRoom.id)

        const { error: clearOccupantsError } = selectedResidentId
          ? await clearOccupantsQuery.neq('id', selectedResidentId)
          : await clearOccupantsQuery

        if (clearOccupantsError) throw clearOccupantsError

        if (selectedResident) {
          const { error: assignResidentError } = await supabase
            .from('profiles')
            .update({ room_id: editingRoom.id })
            .eq('id', selectedResident.id)

          if (assignResidentError) throw assignResidentError
        }

        const { error } = await supabase
          .from('rooms')
          .update({
            room_number: formValues.roomNumber.trim(),
            floor: formValues.floor.trim(),
            status: nextStatus,
          })
          .eq('id', editingRoom.id)

        if (error) throw error

        setRooms((prev) =>
          prev.map((room) =>
            room.id === editingRoom.id
              ? {
                  ...room,
                  roomNumber: formValues.roomNumber.trim(),
                  floor: formValues.floor.trim(),
                  status: nextStatus,
                  currentResidentName: selectedResident?.full_name ?? null,
                  occupantCount: selectedResident ? 1 : 0,
                }
              : room
          )
        )

        toast.success('อัปเดตข้อมูลห้องเรียบร้อยแล้ว')
      } else {
        const nextStatus = selectedResident ? 'occupied' : 'available'
        const { data, error } = (await supabase
          .from('rooms')
          .insert({
            room_number: formValues.roomNumber.trim(),
            floor: formValues.floor.trim(),
            status: nextStatus,
          })
          .select('id, room_number, floor, status')
          .single()) as {
          data: { id: string; room_number: string; floor: string; status: string } | null
          error: Error | null
        }

        if (error) throw error
        if (!data) throw new Error('ไม่สามารถเพิ่มห้องได้')

        if (selectedResident) {
          const { error: assignResidentError } = await supabase
            .from('profiles')
            .update({ room_id: data.id })
            .eq('id', selectedResident.id)

          if (assignResidentError) {
            await supabase.from('rooms').delete().eq('id', data.id)
            throw assignResidentError
          }
        }

        setRooms((prev) => [
          {
            id: data.id,
            roomNumber: data.room_number,
            floor: data.floor,
            status: data.status,
            currentResidentName: selectedResident?.full_name ?? null,
            activeTicketCount: 0,
            occupantCount: selectedResident ? 1 : 0,
          },
          ...prev,
        ])

        toast.success('เพิ่มห้องใหม่เรียบร้อยแล้ว')
      }

      setDialogOpen(false)
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลห้องได้'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="text-3xl font-bold">จัดการห้อง</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={false}>
          <DialogTrigger asChild></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoom ? 'แก้ไขข้อมูลห้อง' : 'เพิ่มห้องใหม่'}</DialogTitle>
              <DialogDescription>
                เพื่อ{editingRoom ? 'แก้ไขข้อมูลห้อง' : 'เพิ่มห้องใหม่'}{' '}
                กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="room-number">เลขห้อง</FieldLabel>
                <Input
                  id="room-number"
                  value={formValues.roomNumber}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, roomNumber: event.target.value }))
                  }
                  placeholder="เช่น A-201"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="room-floor">ชั้น</FieldLabel>
                <Input
                  id="room-floor"
                  value={formValues.floor}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, floor: event.target.value }))
                  }
                  placeholder="เช่น 2"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="room-resident">ผู้พัก</FieldLabel>
                <Combobox
                  items={residentOptions}
                  value={selectedResident}
                  itemToStringLabel={(resident) => resident.full_name}
                  itemToStringValue={(resident) => resident.id}
                  onValueChange={(value) => {
                    const nextResident = value ?? null
                    const isClearingResident = selectedResident !== null && nextResident === null

                    setSelectedResident(nextResident)
                    setShowClearWarning(editingRoom ? isClearingResident : false)
                  }}
                  autoHighlight
                >
                  <ComboboxInput
                    className="w-full"
                    id="room-resident"
                    placeholder={loadingResidents ? 'กำลังโหลดรายชื่อผู้พัก...' : 'เลือกผู้พัก'}
                    disabled={loadingResidents}
                    showClear
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>ไม่พบผู้พักที่ยังไม่มีห้อง</ComboboxEmpty>
                    <ComboboxList>
                      {(resident) => (
                        <ComboboxItem key={resident.id} value={resident}>
                          {resident.full_name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            </FieldGroup>

            <DialogFooter>
              {editingRoom && showClearWarning ? (
                <p className="text-destructive mr-auto text-xs">
                  หมายเหตุ: การบันทึกจะทำให้ห้องนี้กลายเป็นสถานะว่าง
                </p>
              ) : null}
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveRoom} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive size-12">
              <Trash2 className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>ลบห้อง {deletingRoom?.roomNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              การกระทำนี้ไม่สามารถยกเลิกได้ ห้อง{' '}
              <span className="font-medium">{deletingRoom?.roomNumber}</span>{' '}
              จะถูกลบออกจากระบบอย่างถาวร
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteRoom}
              disabled={isDeleting}
            >
              {isDeleting ? 'กำลังลบ...' : 'ลบ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="*:from-primary/5 *:to-card grid grid-cols-1 gap-4 *:bg-linear-to-t *:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>ห้องทั้งหมด</CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.total}</CardTitle>
            <CardAction>
              <Building2 className="text-muted-foreground size-4" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">จำนวนห้องในระบบ</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>ห้องว่าง</CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.available}</CardTitle>
            <CardAction>
              <DoorOpen className="size-4 text-emerald-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">พร้อมรองรับผู้พักใหม่</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>ห้องที่มีผู้พัก</CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.occupied}</CardTitle>
            <CardAction>
              <UsersRound className="size-4 text-blue-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">กำลังมีผู้พักอาศัยอยู่</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>งานซ่อมที่ยังไม่ปิด</CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.activeTickets}</CardTitle>
            <CardAction>
              <Wrench className="size-4 text-amber-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">ใบแจ้งซ่อมที่ยัง active</p>
          </CardFooter>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">เพิ่ม แก้ไข ห้อง</CardTitle>
          <CardDescription>ภาพรวมสถานะห้อง รายชื่อห้องทั้งหมด</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <InputGroup className="w-full max-w-xs items-center">
              <InputGroupAddon align="inline-start">
                <InputGroupText>
                  <Search />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                placeholder="ค้นหาเลขห้อง, ชั้น, ผู้พัก"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </InputGroup>

            <div className="flex h-fit items-center gap-2">
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกชั้น" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    <SelectItem value="all">ทุกชั้น</SelectItem>
                    {floors.map((floor) => (
                      <SelectItem key={floor} value={floor}>
                        ชั้น {floor}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    {roomStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                onClick={handleOpenCreateDialog}
                variant="default"
                className="md:w-32"
                disabled={readOnly}
              >
                <Plus className="size-4" />
                <span className="hidden lg:inline">เพิ่มห้อง</span>
              </Button>
            </div>
          </div>

          <DataTable columns={tableColumns} data={filteredRooms} emptyMessage="ไม่พบข้อมูลห้อง" />
        </CardContent>
      </Card>
    </div>
  )
}
