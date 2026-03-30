import { describe, it, expect } from 'vitest'
import { statusConfig, categoryConfig } from '@/lib/constants'
import type { TicketStatus, TicketCategory } from '@/lib/constants'

describe('statusConfig', () => {
  const validStatuses: TicketStatus[] = ['pending', 'in_progress', 'completed', 'cancelled']

  it('contains exactly the four expected status keys', () => {
    const keys = Object.keys(statusConfig)
    expect(keys).toHaveLength(4)
    expect(keys).toEqual(expect.arrayContaining(validStatuses))
  })

  it.each(validStatuses)('status "%s" has a label, color, and icon', (status) => {
    const cfg = statusConfig[status]
    expect(typeof cfg.label).toBe('string')
    expect(cfg.label.length).toBeGreaterThan(0)
    expect(typeof cfg.color).toBe('string')
    expect(cfg.color.length).toBeGreaterThan(0)
    // lucide-react icons are React components (may be objects or functions depending on environment)
    expect(cfg.icon).toBeTruthy()
  })

  it('pending status has the correct Thai label', () => {
    expect(statusConfig.pending.label).toBe('รอดำเนินการ')
  })

  it('in_progress status has the correct Thai label', () => {
    expect(statusConfig.in_progress.label).toBe('กำลังดำเนินการ')
  })

  it('completed status has the correct Thai label', () => {
    expect(statusConfig.completed.label).toBe('เสร็จสิ้น')
  })

  it('cancelled status has the correct Thai label', () => {
    expect(statusConfig.cancelled.label).toBe('ยกเลิก')
  })
})

describe('categoryConfig', () => {
  const validCategories: TicketCategory[] = [
    'electrical',
    'plumbing',
    'air_conditioning',
    'furniture',
    'other',
  ]

  it('contains exactly the five expected category keys', () => {
    const keys = Object.keys(categoryConfig)
    expect(keys).toHaveLength(5)
    expect(keys).toEqual(expect.arrayContaining(validCategories))
  })

  it.each(validCategories)('category "%s" has a non-empty Thai label', (category) => {
    const label = categoryConfig[category]
    expect(typeof label).toBe('string')
    expect(label.length).toBeGreaterThan(0)
  })

  it('maps electrical to the correct Thai label', () => {
    expect(categoryConfig.electrical).toBe('ไฟฟ้า')
  })

  it('maps plumbing to the correct Thai label', () => {
    expect(categoryConfig.plumbing).toBe('ประปา')
  })

  it('maps air_conditioning to the correct Thai label', () => {
    expect(categoryConfig.air_conditioning).toBe('เครื่องปรับอากาศ')
  })

  it('maps furniture to the correct Thai label', () => {
    expect(categoryConfig.furniture).toBe('เฟอร์นิเจอร์')
  })

  it('maps other to the correct Thai label', () => {
    expect(categoryConfig.other).toBe('อื่นๆ')
  })
})

describe('TicketStatus type', () => {
  it('accepts valid status values at compile time (runtime check)', () => {
    const status: TicketStatus = 'pending'
    expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(status)
  })
})

describe('TicketCategory type', () => {
  it('accepts valid category values at compile time (runtime check)', () => {
    const category: TicketCategory = 'electrical'
    expect(['electrical', 'plumbing', 'air_conditioning', 'furniture', 'other']).toContain(category)
  })
})
