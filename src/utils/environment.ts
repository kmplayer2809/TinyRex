export function resolveTemplate(
  input: string,
  values: Record<string, string>,
): string {
  return input.replace(/{{([A-Za-z0-9_]+)}}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key]
    }

    return match
  })
}
