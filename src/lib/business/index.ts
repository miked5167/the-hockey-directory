// Business logic exports
export * from './subscriptions'
export * from './leads'
export * from './commissions'
export * from './featured-listings'

// Utility functions for JSON parsing since we store arrays as JSON strings
export function parseJsonField<T>(field: string | null): T[] {
  if (!field) return []
  try {
    return JSON.parse(field) as T[]
  } catch {
    return []
  }
}

export function stringifyJsonField<T>(data: T[]): string {
  return JSON.stringify(data)
}