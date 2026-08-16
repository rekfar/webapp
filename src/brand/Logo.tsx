import { WaypointMark } from './WaypointMark'

/**
 * The primary lockup: waypoint mark on a rust tile, followed by the wordmark
 * in Space Grotesk. `as` picks the wordmark element — the page's single <h1>
 * in the header, a plain <span> anywhere the lockup is decorative.
 */
export function Logo({ as: Tag = 'span' }: { as?: 'h1' | 'span' }) {
  return (
    <span className="brand">
      <span className="brand__tile">
        <WaypointMark size={18} />
      </span>
      <Tag className="brand__word">Rekfar</Tag>
    </span>
  )
}
