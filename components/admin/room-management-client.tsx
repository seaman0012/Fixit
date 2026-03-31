'use client'

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, DoorOpen, PencilLine, Plus, Search, UsersRound, Wrench } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

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
  status: string
}

const roomStatusOptions = [
  { value: 'available', label: 'ว่าง' },
  { value: 'occupied', label: 'มีผู้พัก' },
  { value: 'maintenance', label: 'ปิดปรับปรุง' },
]

function getRoomStatusLabel(status: string) {
  return roomStatusOptions.find((item) => item.value === status)?.label ?? status
}

function getRoomStatusVariant(status: string): 'outline' | 'secondary' | 'destructive' {
  if (status === 'occupied') return 'secondary'
  if (status === 'maintenance') return 'destructive'
  return 'outline'
}

export default function RoomManagementClient({ initialRooms }: { initialRooms: RoomRecord[] }) {
  const [rooms, setRooms] = useState<RoomRecord[]>(initialRooms)
  const [search, setSearch] = useState('')
  const [selectedFloor, setSelectedFloor] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [formValues, setFormValues] = useState<RoomFormValues>({
    roomNumber: '',
    floor: '',
    status: 'available',
  })

  const floors = useMemo(() => {
    return Array.from(new Set(rooms.map((room) => room.floor))).sort((a, b) => a.localeCompare(b))
  }, [rooms])

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase()

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
  }, [rooms, search, selectedFloor, selectedStatus])

  const stats = useMemo(() => {
    const total = rooms.length
    const available = rooms.filter((room) => room.status === 'available').length
    const occupied = rooms.filter(
      (room) => room.status === 'occupied' || room.occupantCount > 0
    ).length
    const activeTickets = rooms.reduce((sum, room) => sum + room.activeTicketCount, 0)

    return { total, available, occupied, activeTickets }
  }, [rooms])

  const tableColumns = useMemo<ColumnDef<RoomRecord>[]>(
    () => [
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
        cell: ({ row }) => (
          <Badge variant={getRoomStatusVariant(row.original.status)}>
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
            <Badge variant="outline">{row.original.activeTicketCount} รายการ</Badge>
          ) : (
            <Badge variant="outline">ไม่มี</Badge>
          ),
      },
      {
        id: 'actions',
        header: 'จัดการ',
        size: 100,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(row.original)}>
              <PencilLine data-icon="inline-start" />
              แก้ไข
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const resetForm = () => {
    setEditingRoom(null)
    setFormValues({ roomNumber: '', floor: '', status: 'available' })
  }

  const handleOpenCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (room: RoomRecord) => {
    setEditingRoom(room)
    setFormValues({
      roomNumber: room.roomNumber,
      floor: room.floor,
      status: room.status,
    })
    setDialogOpen(true)
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
        const { error } = await supabase
          .from('rooms')
          .update({
            room_number: formValues.roomNumber.trim(),
            floor: formValues.floor.trim(),
            status: formValues.status,
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
                  status: formValues.status,
                }
              : room
          )
        )

        toast.success('อัปเดตข้อมูลห้องเรียบร้อยแล้ว')
      } else {
        const { data, error } = (await supabase
          .from('rooms')
          .insert({
            room_number: formValues.roomNumber.trim(),
            floor: formValues.floor.trim(),
            status: 'available',
          })
          .select('id, room_number, floor, status')
          .single()) as {
          data: { id: string; room_number: string; floor: string; status: string } | null
          error: Error | null
        }

        if (error) throw error
        if (!data) throw new Error('ไม่สามารถเพิ่มห้องได้')

        setRooms((prev) => [
          {
            id: data.id,
            roomNumber: data.room_number,
            floor: data.floor,
            status: data.status,
            currentResidentName: null,
            activeTicketCount: 0,
            occupantCount: 0,
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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

              {editingRoom ? (
                <Field>
                  <FieldLabel htmlFor="room-status">สถานะ</FieldLabel>
                  <Select
                    value={formValues.status}
                    onValueChange={(value) => setFormValues((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="room-status">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {roomStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}
            </FieldGroup>

            <DialogFooter>
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
                <SelectContent position="popper" className="">
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
                <SelectContent>
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
              <Button onClick={handleOpenCreateDialog} variant="default">
                <Plus className="size-4" />
                <span className="hidden lg:inline">เพิ่ม</span>
              </Button>
            </div>
          </div>

          <DataTable columns={tableColumns} data={filteredRooms} emptyMessage="ไม่พบข้อมูลห้อง" />
        </CardContent>
      </Card>
    </div>
  )
}
