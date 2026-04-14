export function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatArray<T>(array: Readonly<Iterable<T>>, map: (item: T) => string | undefined | null) {
  const items = Array.from(array).filter((item) => item !== undefined && item !== null);
  if (!items.length) return undefined;

  const mappedItems = items.map(map).filter((item) => item !== undefined && item !== null) as string[];
  if (!mappedItems.length) return undefined;

  if (mappedItems.length === 1) return mappedItems[0];
  if (mappedItems.length <= 3) return mappedItems.join(",");

  return `${mappedItems.slice(0, 3).join(",")} et ${mappedItems.length - 3} autre(s)`;
}
