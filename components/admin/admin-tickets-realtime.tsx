'use client'

import { useEffect, useState } from 'react'
import type { DataTableTicket } from '@/components/ui/data-table'
import { DataTable } from '@/components/ui/data-table'
import { createClient } from '@/lib/supabase/client'

function toTicketRow(ticket: any): DataTableTicket {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    status: ticket.status,
    created_at: ticket.created_at,
    categories: ticket.categories,
    rooms: ticket.rooms,
    profiles: ticket.profiles,
  }
}

export default function AdminTicketsRealtime({
  initialTickets,
}: {
  initialTickets: DataTableTicket[]
}) {
  const [tickets, setTickets] = useState<DataTableTicket[]>(initialTickets)

  useEffect(() => {
    const supabase = createClient()

    const fetchTicketById = async (ticketId: string) => {
      const { data } = await supabase
        .from('tickets')
        .select(
          `
          *,
          rooms:room_id (
            room_number
          ),
          profiles:user_id (
            full_name,
            phone
          ),
          categories:category_id (
            name
          )
        `
        )
        .eq('id', ticketId)
        .single()

      if (!data || !data.created_at) {
        return null
      }

      return toTicketRow(data)
    }

    const upsertTicket = (nextTicket: DataTableTicket) => {
      setTickets((prev) => {
        const index = prev.findIndex((item) => item.id === nextTicket.id)
        const next = [...prev]

        if (index >= 0) {
          next[index] = nextTicket
        } else {
          next.unshift(nextTicket)
        }

        next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return next
      })
    }

    const channel = supabase
      .channel('admin-tickets:all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = String(payload.old.id)
            setTickets((prev) => prev.filter((item) => item.id !== deletedId))
            return
          }

          const changedId = String(payload.new.id)
          const nextTicket = await fetchTicketById(changedId)
          if (nextTicket) {
            upsertTicket(nextTicket)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <DataTable
      tickets={tickets}
      detailBasePath="/admin/tickets"
      pageSize={10}
      showReporter
      showSearch
      showPagination
      showStatusFilter
      showStatusCountBadges
      showViewAllButton={false}
    />
  )
}
