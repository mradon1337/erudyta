import type { ReactNode } from 'react'

/** Kształty ikon skopiowane z makiet (`design/project/`). Liniowe 24×24, `currentColor`. */
const SHAPES = {
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M5 12.5 10 17 19 7" />,
  cross: <path d="M6 6l12 12M18 6 6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  fifty: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
    </>
  ),
  stopwatch: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4M10 2h4" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
    </>
  ),
  play: <path d="M7 4l13 8-13 8z" fill="currentColor" stroke="none" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof SHAPES

interface Props {
  name: IconName
  size?: number
  strokeWidth?: number
  /** Gdy ikona niesie znaczenie (np. ptaszek przy poprawnej odpowiedzi) — opis dla czytnika ekranu. */
  label?: string
  className?: string
}

export function Icon({ name, size = 24, strokeWidth = 2, label, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {SHAPES[name]}
    </svg>
  )
}
