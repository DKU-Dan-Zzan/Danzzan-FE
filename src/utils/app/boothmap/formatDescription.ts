export function formatDescription(description?: string | null) {
  if (!description) return "";
  return description.replace(/\\n/g, "\n");
}
