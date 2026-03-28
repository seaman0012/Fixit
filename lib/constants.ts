import { Clock, CheckCircle2, AlertCircle, Loader } from 'lucide-react'

// Status configuration for tickets
export const statusConfig = {
  pending: {
    label: 'รอดำเนินการ',
    color: 'text-yellow-800',
    icon: Clock,
  },
  in_progress: {
    label: 'กำลังดำเนินการ',
    color: 'text-blue-800',
    icon: Loader,
  },
  completed: {
    label: 'เสร็จสิ้น',
    color: 'text-green-400',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'ยกเลิก',
    color: 'text-red-500',
    icon: AlertCircle,
  },
} as const

// Category configuration for tickets
export const categoryConfig = {
  electrical: 'ไฟฟ้า',
  plumbing: 'ประปา',
  air_conditioning: 'เครื่องปรับอากาศ',
  furniture: 'เฟอร์นิเจอร์',
  other: 'อื่นๆ',
} as const

// Type exports for better type safety
export type TicketStatus = keyof typeof statusConfig
export type TicketCategory = keyof typeof categoryConfig
