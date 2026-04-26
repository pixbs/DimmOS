'use client'

import { useEffect, useState } from 'react'

function formatTime(date: Date): string {
  let hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours}:${minutes}${ampm}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!now) return null

  return (
    <div className="flex gap-4">
      <time dateTime={now.toISOString()}>{formatTime(now)}</time>
      <time dateTime={now.toISOString()}>{formatDate(now)}</time>
    </div>
  )
}
