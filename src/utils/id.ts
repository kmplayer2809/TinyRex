let fallbackCounter = 0

export function createId(): string {
  const randomUUID = globalThis.crypto?.randomUUID
  if (typeof randomUUID === 'function') {
    return randomUUID.call(globalThis.crypto)
  }

  const timestampPart = Date.now().toString(36)
  const counterPart = (fallbackCounter++).toString(36).padStart(4, '0')
  return `${timestampPart}-${counterPart}`
}
