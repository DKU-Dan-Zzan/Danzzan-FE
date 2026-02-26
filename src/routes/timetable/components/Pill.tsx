import React from "react"

export default function Pill({
  icon,
  text,
  tone = "solid",
}: {
  icon: React.ReactNode
  text: string
  tone?: "solid" | "soft"
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
        tone === "solid" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700",
      ].join(" ")}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="truncate">{text}</span>
    </span>
  )
}