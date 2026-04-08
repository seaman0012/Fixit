'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
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
import {
  CircleSmall,
  KeyRound,
  MailPlus,
  RotateCcw,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
  UsersRound,
} from 'lucide-react'

export interface UserRecord {
  id: string
  fullName: string
  phone: string | null
  email: string
  role: string
  status: string
  roomId: string | null
  roomNumber: string | null
  isActive: boolean
}

export interface AvailableRoomOption {
  id: string
  roomNumber: string
}

type InviteFormValues = {
  fullName: string
  phone: string
  email: string
  roomId: string
}

function getRoleLabel(role: string) {
  if (role === 'admin') return 'Admin'
  if (role === 'owner') return 'Owner'
  if (role === 'resident') return 'Resident'
  return role
}

function getRoleVariant(role: string): 'secondary' | 'outline' {
  if (role === 'admin' || role === 'owner') return 'secondary'
  return 'outline'
}

function getStatusLabel(status: string) {
  if (status === 'active') return 'Active'
  if (status === 'pending') return 'Pending'
  if (status === 'inactive') return 'Inactive'
  return status
}

function getStatusVariant(status: string): 'secondary' | 'outline' {
  if (status === 'active') return 'secondary'
  if (status === 'pending') return 'secondary'
  return 'secondary'
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((value) => value[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function UserManagementClient({
  initialUsers,
  availableRooms,
  readOnly = false,
}: {
  initialUsers: UserRecord[]
  availableRooms: AvailableRoomOption[]
  readOnly?: boolean
}) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers)
  const [inviteRooms, setInviteRooms] = useState<AvailableRoomOption[]>(availableRooms)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [selectedInviteRoom, setSelectedInviteRoom] = useState<AvailableRoomOption | null>(null)
  const [inviteForm, setInviteForm] = useState<InviteFormValues>({
    fullName: '',
    phone: '',
    email: '',
    roomId: '',
  })

  const filteredUsers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()

    return users.filter((user) => {
      const matchSearch =
        query.length === 0 ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone ?? '').toLowerCase().includes(query) ||
        (user.roomNumber ?? '').toLowerCase().includes(query)
      const matchRole = roleFilter === 'all' || user.role === roleFilter
      const matchStatus = statusFilter === 'all' || user.status === statusFilter

      return matchSearch && matchRole && matchStatus
    })
  }, [users, debouncedSearch, roleFilter, statusFilter])

  const roleOptions = useMemo(() => {
    return Array.from(new Set(users.map((user) => user.role))).sort((a, b) => a.localeCompare(b))
  }, [users])

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((user) => user.status === 'active').length
    const pending = users.filter((user) => user.status === 'pending').length
    const inactive = users.filter((user) => user.status === 'inactive').length
    const adminsAndOwners = users.filter(
      (user) => user.role === 'admin' || user.role === 'owner'
    ).length

    return { total, active, pending, inactive, adminsAndOwners }
  }, [users])

  const handleToggleActive = useCallback((user: UserRecord) => {
    void (async () => {
      if (user.role === 'admin' || user.role === 'owner') {
        toast.error('ไม่สามารถระงับบัญชีของผู้ดูแลหรือเจ้าของระบบได้')
        return
      }

      const nextActive = !user.isActive
      setUpdatingUserId(user.id)

      try {
        const response = await fetch('/api/admin/invite-user', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id, isActive: nextActive }),
        })

        const payload = (await response.json()) as { error?: string }
        if (!response.ok) {
          throw new Error(payload.error || 'ไม่สามารถอัปเดตสถานะบัญชีได้')
        }

        setUsers((prev) =>
          prev.map((item) =>
            item.id === user.id
              ? {
                  ...item,
                  isActive: nextActive,
                  status: nextActive ? 'active' : 'inactive',
                }
              : item
          )
        )

        if (nextActive) {
          toast.success('คืนสถานะบัญชีเรียบร้อยแล้ว')
        } else {
          toast.success('ระงับการใช้งานบัญชีเรียบร้อยแล้ว')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'ไม่สามารถอัปเดตสถานะบัญชีได้'
        toast.error(message)
      } finally {
        setUpdatingUserId(null)
      }
    })()
  }, [])

  const handleCancelInvite = useCallback((user: UserRecord) => {
    void (async () => {
      if (user.status !== 'pending') {
        toast.error('ยกเลิกได้เฉพาะคำเชิญที่อยู่ในสถานะรอการยืนยัน')
        return
      }

      setUpdatingUserId(user.id)

      try {
        const response = await fetch('/api/admin/invite-user', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        })

        const payload = (await response.json()) as { error?: string }

        if (!response.ok) {
          throw new Error(payload.error || 'ไม่สามารถยกเลิกคำเชิญได้')
        }

        setUsers((prev) => prev.filter((item) => item.id !== user.id))

        const roomId = user.roomId

        if (roomId) {
          setInviteRooms((prev) => {
            if (prev.some((room) => room.id === roomId)) {
              return prev
            }

            return [
              ...prev,
              {
                id: roomId,
                roomNumber: user.roomNumber ?? '',
              },
            ].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
          })
        }

        toast.success('ยกเลิกคำเชิญเรียบร้อยแล้ว')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'ไม่สามารถยกเลิกคำเชิญได้'
        toast.error(message)
      } finally {
        setUpdatingUserId(null)
      }
    })()
  }, [])

  const tableColumns = useMemo<ColumnDef<UserRecord>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'ผู้ใช้',
        size: 200,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback>{getInitials(row.original.fullName)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.fullName}</span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'อีเมล',
        size: 300,
      },
      {
        accessorKey: 'phone',
        header: 'เบอร์โทร',
        size: 200,
        cell: ({ row }) => row.original.phone ?? '-',
      },
      {
        accessorKey: 'roomNumber',
        header: 'ห้อง',
        size: 80,
        cell: ({ row }) => row.original.roomNumber ?? '-',
      },
      {
        accessorKey: 'role',
        header: 'บทบาท',
        size: 120,
        cell: ({ row }) =>
          row.original.role === 'admin' ? (
            <Badge variant={getRoleVariant(row.original.role)}>
              <ShieldCheck data-icon="inline-start" />
              {getRoleLabel(row.original.role)}
            </Badge>
          ) : row.original.role === 'owner' ? (
            <Badge variant={getRoleVariant(row.original.role)}>
              <KeyRound data-icon="inline-start" />
              {getRoleLabel(row.original.role)}
            </Badge>
          ) : (
            <Badge variant={getRoleVariant(row.original.role)}>
              <User data-icon="inline-start" />
              {getRoleLabel(row.original.role)}
            </Badge>
          ),
      },
      {
        accessorKey: 'status',
        header: 'สถานะบัญชี',
        size: 140,
        cell: ({ row }) =>
          row.original.status === 'pending' ? (
            <Badge variant={getStatusVariant(row.original.status)}>
              <CircleSmall
                fill="currentColor"
                data-icon="inline-start"
                className="text-amber-400"
              />
              {getStatusLabel(row.original.status)}
            </Badge>
          ) : row.original.status === 'active' ? (
            <Badge variant={getStatusVariant(row.original.status)}>
              <CircleSmall
                fill="currentColor"
                data-icon="inline-start"
                className="text-green-400"
              />
              {getStatusLabel(row.original.status)}
            </Badge>
          ) : (
            <Badge variant={getStatusVariant(row.original.status)}>
              <CircleSmall fill="currentColor" data-icon="inline-start" className="text-red-400" />
              {getStatusLabel(row.original.status)}
            </Badge>
          ),
      },
      {
        id: 'actions',
        header: 'การควบคุมบัญชี',
        size: 150,
        cell: ({ row }) => {
          const isProtected = row.original.role === 'admin' || row.original.role === 'owner'
          const isPending = row.original.status === 'pending'
          const isActive = row.original.status === 'active'

          return (
            <div className="flex justify-start">
              {isPending ? (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={updatingUserId === row.original.id || readOnly}
                  onClick={() => handleCancelInvite(row.original)}
                >
                  <UserX data-icon="inline-start" />
                  ยกเลิกคำเชิญ
                </Button>
              ) : (
                <Button
                  variant={isActive ? 'destructive' : 'outline'}
                  size="sm"
                  disabled={isProtected || updatingUserId === row.original.id || readOnly}
                  onClick={() => handleToggleActive(row.original)}
                >
                  {isActive ? (
                    <UserMinus data-icon="inline-start" />
                  ) : (
                    <RotateCcw data-icon="inline-start" />
                  )}
                  {isActive ? 'ปิดการใช้งาน' : 'คืนสถานะ'}
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [updatingUserId, readOnly, handleToggleActive, handleCancelInvite]
  )

  const resetInviteForm = () => {
    setSelectedInviteRoom(null)
    setInviteForm({
      fullName: '',
      phone: '',
      email: '',
      roomId: '',
    })
  }

  const handleInviteUser = async () => {
    if (!inviteForm.fullName || !inviteForm.phone || !inviteForm.email || !inviteForm.roomId) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setInviting(true)

    try {
      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      })

      const payload = (await response.json()) as {
        error?: string
        user?: {
          id?: string
          fullName: string
          phone: string
          email: string
          roomId: string
          roomNumber: string
          role: string
          isActive: boolean
          status: string
        }
      }

      if (!response.ok) {
        throw new Error(payload.error || 'ไม่สามารถเชิญผู้ใช้ได้')
      }

      if (payload.user) {
        const invitedUser = payload.user

        setUsers((prev) => [
          {
            id: invitedUser.id ?? crypto.randomUUID(),
            fullName: invitedUser.fullName,
            phone: invitedUser.phone,
            email: invitedUser.email,
            role: invitedUser.role,
            status: invitedUser.status,
            roomId: invitedUser.roomId,
            roomNumber: invitedUser.roomNumber,
            isActive: invitedUser.isActive,
          },
          ...prev,
        ])

        setInviteRooms((prev) => prev.filter((room) => room.id !== invitedUser.roomId))
      }

      toast.success('ส่งอีเมลเชิญผู้ใช้สำเร็จแล้ว')
      resetInviteForm()
      setInviteDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ไม่สามารถเชิญผู้ใช้ได้'
      toast.error(message)
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="text-3xl font-bold">จัดการผู้ใช้</h1>
      </div>

      <div className="*:from-primary/5 *:to-card grid grid-cols-1 gap-4 *:bg-linear-to-t *:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
        <Card>
          <CardHeader>
            <CardDescription>ผู้ใช้ทั้งหมด</CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.total}</CardTitle>
            <CardAction>
              <UsersRound className="text-muted-foreground size-4" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">จำนวนบัญชีในระบบ</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>บัญชี Active</CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.active}</CardTitle>
            <CardAction>
              <UserCheck className="size-4 text-emerald-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">ใช้งานระบบได้ตามปกติ</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>รอการยืนยัน</CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.pending}</CardTitle>
            <CardAction>
              <MailPlus className="size-4 text-amber-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">เชิญแล้วแต่ยังไม่กดยืนยัน</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>บัญชี Suspended</CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.inactive}</CardTitle>
            <CardAction>
              <UserX className="size-4 text-rose-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">บัญชีที่ถูกระงับ</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Admin + Owner</CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.adminsAndOwners}</CardTitle>
            <CardAction>
              <ShieldCheck className="size-4 text-blue-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">สิทธิ์จัดการระบบ</p>
          </CardFooter>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">เพิ่มและจัดการผู้ใช้ใหม่</CardTitle>
          <CardDescription>
            ตารางผู้ใช้พร้อมฟิลเตอร์บทบาทและสถานะบัญชี รวมทั้งการเชิญผู้พักใหม่เข้าระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <InputGroup className="w-full max-w-xs items-center md:col-span-2">
              <InputGroupAddon align="inline-start">
                <InputGroupText>
                  <Search />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                placeholder="ค้นหา ชื่อ, อีเมล, เบอร์โทร, เลขห้อง"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </InputGroup>

            <div className="flex h-fit items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">ทุกบทบาท</SelectItem>
                    {roleOptions.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะบัญชี" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} modal={false}>
                <DialogTrigger asChild>
                  <Button variant="default" className="md:w-32" disabled={readOnly}>
                    <UserPlus data-icon="inline-start" />
                    เพิ่มผู้ใช้ใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เชิญผู้ใช้งานใหม่</DialogTitle>
                    <DialogDescription>
                      กรอกข้อมูลผู้พักเพื่อส่งคำเชิญผ่านอีเมล ระบบจะเพิ่มบัญชีและผูกห้องให้อัตโนมัติ
                    </DialogDescription>
                  </DialogHeader>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="invite-full-name">ชื่อ-นามสกุล</FieldLabel>
                      <Input
                        id="invite-full-name"
                        value={inviteForm.fullName}
                        onChange={(event) =>
                          setInviteForm((prev) => ({ ...prev, fullName: event.target.value }))
                        }
                        placeholder="เช่น สมชาย ใจดี"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="invite-phone">เบอร์โทรศัพท์</FieldLabel>
                      <Input
                        id="invite-phone"
                        value={inviteForm.phone}
                        onChange={(event) =>
                          setInviteForm((prev) => ({ ...prev, phone: event.target.value }))
                        }
                        placeholder="เช่น 0891234567"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="invite-email">อีเมล</FieldLabel>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(event) =>
                          setInviteForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        placeholder="resident@example.com"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="invite-room">ห้องว่าง</FieldLabel>
                      <Combobox
                        items={inviteRooms}
                        value={selectedInviteRoom}
                        itemToStringLabel={(room) => room.roomNumber}
                        itemToStringValue={(room) => room.id}
                        onValueChange={(value) => {
                          setSelectedInviteRoom(value ?? null)
                          setInviteForm((prev) => ({ ...prev, roomId: value?.id ?? '' }))
                        }}
                        autoHighlight
                      >
                        <ComboboxInput id="invite-room" placeholder="เลือกห้อง" showClear />
                        <ComboboxContent>
                          <ComboboxEmpty>ไม่พบห้องว่าง</ComboboxEmpty>
                          <ComboboxList>
                            {(room) => (
                              <ComboboxItem key={room.id} value={room}>
                                {room.roomNumber}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </Field>
                  </FieldGroup>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setInviteDialogOpen(false)}
                      disabled={inviting}
                    >
                      ยกเลิก
                    </Button>
                    <Button onClick={handleInviteUser} disabled={inviting}>
                      {inviting ? 'กำลังส่งคำเชิญ...' : 'ส่งคำเชิญ'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <DataTable
            columns={tableColumns}
            data={filteredUsers}
            emptyMessage="ไม่พบข้อมูลผู้ใช้ตามเงื่อนไขที่เลือก"
          />
        </CardContent>
      </Card>
    </div>
  )
}
