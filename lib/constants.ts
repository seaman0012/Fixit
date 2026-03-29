import { Clock, CheckCircle2, AlertCircle, Loader } from 'lucide-react'

// Status configuration for tickets
export const statusConfig = {
  pending: {
    label: 'รอดำเนินการ',
    color: 'text-muted-foreground',
    icon: Clock,
  },
  in_progress: {
    label: 'กำลังดำเนินการ',
    color: 'text-blue-500 dark:text-blue-400',
    icon: Loader,
  },
  completed: {
    label: 'เสร็จสิ้น',
    color: 'text-white dark:text-background fill-green-500  dark:fill-green-400',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'ยกเลิก',
    color: 'text-white dark:text-background fill-red-500  dark:fill-red-400',
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
