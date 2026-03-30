import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('returns a single class name unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('joins multiple class names with a space', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('ignores falsy values (undefined, null, false, empty string)', () => {
    expect(cn('foo', undefined, null, false, '', 'bar')).toBe('foo bar')
  })

  it('merges conflicting Tailwind classes, keeping the last one', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional class objects', () => {
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500')
    expect(cn({ hidden: false, block: true })).toBe('block')
  })

  it('handles array of class names', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles mixed conditional and string inputs', () => {
    const isActive = true
    const isDisabled = false
    expect(cn('base', { active: isActive, disabled: isDisabled })).toBe('base active')
  })

  it('deduplicates identical class names via Tailwind merge', () => {
    expect(cn('flex flex-col', 'flex-row')).toBe('flex flex-row')
  })
})
