/**
 * Rekfar's icon mark: four waypoint dots climbing left-to-right, fading in
 * towards the newest point — a route being recorded, one fix at a time.
 *
 * Drawn in `currentColor` so it inherits from whatever it sits on (white on
 * the rust tile, forest on cream). Keep the geometry in sync with
 * `public/favicon.svg`, which is the same mark on a 64-unit grid.
 */
export function WaypointMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="9" cy="25" r="2.2" fill="currentColor" opacity="0.5" />
      <circle cx="15" cy="18" r="2.2" fill="currentColor" opacity="0.7" />
      <circle cx="22" cy="13" r="2.2" fill="currentColor" opacity="0.85" />
      <circle cx="27" cy="7" r="2.6" fill="currentColor" />
    </svg>
  )
}
