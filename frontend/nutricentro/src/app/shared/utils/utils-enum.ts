export function getLabel<T extends string>(value: T | undefined, labels: Record<T, string>): string {
  return value ? labels[value] : '-';
}
