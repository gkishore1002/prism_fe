/** Display label for a branch: name plus city when they differ. */
export function formatCenterLabel(center: { name: string; city?: string | null }): string {
  const name = center.name.trim()
  const city = (center.city ?? '').trim()
  if (!city) return name
  if (name.toLowerCase().includes(city.toLowerCase())) return name
  return `${name} · ${city}`
}

export function centerLabelById(
  id: string,
  centers: { id: string; name: string; city?: string | null }[],
): string {
  const center = centers.find((c) => c.id === id)
  if (!center) return id
  return formatCenterLabel(center)
}

export function centerLabelsForIds(
  ids: string[],
  centers: { id: string; name: string; city?: string | null }[],
): string {
  if (ids.length === 0 || (centers.length > 0 && ids.length === centers.length)) {
    return 'All branches'
  }
  return ids
    .map((id) => centerLabelById(id, centers))
    .filter(Boolean)
    .join(', ')
}
