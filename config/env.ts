const required = (value: string | undefined, name: string): string => {
  if (!value) {
    console.warn(`⚠ Missing environment variable: ${name}`)
    return ""
  }
  return value
}

export const ENV = {
  TICKETING_URL: required(
    import.meta.env.VITE_TICKETING_URL,
    "VITE_TICKETING_URL"
  ),
}