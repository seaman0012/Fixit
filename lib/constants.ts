import { Clock, CheckCircle2, AlertCircle, LucideIcon } from "lucide-react";

// Status configuration for tickets
export const statusConfig = {
  pending: { 
    label: "รอดำเนินการ", 
    color: "bg-yellow-100 text-yellow-800", 
    icon: Clock 
  },
  in_progress: { 
    label: "กำลังดำเนินการ", 
    color: "bg-blue-100 text-blue-800", 
    icon: AlertCircle 
  },
  completed: { 
    label: "เสร็จสิ้น", 
    color: "bg-green-100 text-green-800", 
    icon: CheckCircle2 
  },
  cancelled: { 
    label: "ยกเลิก", 
    color: "bg-gray-100 text-gray-800", 
    icon: AlertCircle 
  },
} as const;

// Category configuration for tickets
export const categoryConfig = {
  electrical: "ไฟฟ้า",
  plumbing: "ประปา",
  air_conditioning: "เครื่องปรับอากาศ",
  furniture: "เฟอร์นิเจอร์",
  other: "อื่นๆ",
} as const;

// Priority configuration for tickets
export const priorityConfig = {
  low: { 
    label: "ต่ำ", 
    color: "bg-gray-100 text-gray-800" 
  },
  medium: { 
    label: "ปานกลาง", 
    color: "bg-blue-100 text-blue-800" 
  },
  high: { 
    label: "สูง", 
    color: "bg-red-100 text-red-800" 
  },
} as const;

// Type exports for better type safety
export type TicketStatus = keyof typeof statusConfig;
export type TicketCategory = keyof typeof categoryConfig;
export type TicketPriority = keyof typeof priorityConfig;
