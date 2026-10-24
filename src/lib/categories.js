/** Display label for a category name / slug from the API */
export function formatCategoryLabel(name) {
  if (!name) return ''
  return String(name)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}
