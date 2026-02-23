const required = (value: string | undefined, name: string): string => {
  if (!value) {
    console.warn(`⚠ Missing environment variable: ${name}`)
    return ""
  }
  return value
}

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  TICKETING_URL: required(
    import.meta.env.VITE_TICKETING_URL,
    "VITE_TICKETING_URL"
  ),
}