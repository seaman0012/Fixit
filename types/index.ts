export type { Database } from './database.types'

import type { Database } from './database.types'

/**
 * Helper types for database relations and extended types
 */

export type Ticket = Database['public']['Tables']['tickets']['Row']
export type Comment = Database['public']['Tables']['ticket_comments']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type TicketHistory = Database['public']['Tables']['ticket_history']['Row']

/** Profile fields returned in selections (not the full Profile) */
export interface SelectedProfile {
  full_name: string
  role: string
}

/** Extended types with relations - serialized for client components */
export interface CommentWithProfile extends Comment {
  profiles: SelectedProfile | null
}

export interface TicketWithProfile extends Ticket {
  profiles: Profile | null
}

export interface AdminTicketWithProfile extends Ticket {
  profiles: Profile | null
}
