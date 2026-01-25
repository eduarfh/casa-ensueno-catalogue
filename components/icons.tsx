// components/icons.tsx
"use client"
import React, { useId } from "react"

export function InstagramIcon({ className = "block", size = 20 }: { className?: string; size?: number }) {
  const id = useId()
  const gradId = `igGrad-${id}`
  const s = size
  return (
    <svg aria-hidden width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="35%" stopColor="#DD2A7B" />
          <stop offset="70%" stopColor="#8134AF" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>

      {/* rounded gradient background */}
      <rect x="0" y="0" width="24" height="24" rx="6" fill={`url(#${gradId})`} />

      {/* camera outline */}
      <rect x="5" y="5" width="14" height="14" rx="4" stroke="#fff" strokeWidth="1.5" fill="none" />

      {/* lens */}
      <circle cx="12" cy="12" r="3.1" stroke="#fff" strokeWidth="1.5" fill="none" />

      {/* small top-right dot */}
      <circle cx="17.2" cy="6.8" r="0.9" fill="#fff" />
    </svg>
  )
}

export function FacebookIcon({ className = "block", size = 20 }: { className?: string; size?: number }) {
  const s = size
  return (
    <svg aria-hidden width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* blue circular background */}
      <circle cx="12" cy="12" r="12" fill="#1877F2" />

      {/* white 'f' (stylized) */}
      <path
        d="M14.6 7.5h-1.1c-.4 0-.8.3-.8.7v1.1H15l-.2 1.6h-1.9v5.1h-1.9v-5.1H9.7v-1.6h1.1V9c0-1.2.8-2.5 2.4-2.5h1.4v1z"
        fill="#fff"
      />
    </svg>
  )
}

export function GmailIcon({ className = "block", size = 20 }: { className?: string; size?: number }) {
  const s = size
  return (
    <svg aria-hidden width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* red rounded background */}
      <rect x="0" y="0" width="24" height="24" rx="4" fill="#D93025" />

      {/* white envelope shape */}
      <path
        d="M3 7.5v9a1.5 1.5 0 001.5 1.5h15A1.5 1.5 0 0021 16.5v-9a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 7.5z"
        fill="#fff"
      />
      {/* flap / M stroke to emulate Gmail 'M' */}
      <path
        d="M3 7.5l8.8 5.9a1 1 0 001.2 0L21 7.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 16.5v-9z"
        fill="#fff"
        opacity="0.95"
      />
      <path
        d="M4 8.2l7.8 5.2L19.6 8.2"
        stroke="#D93025"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
