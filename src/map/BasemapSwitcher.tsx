import { BASEMAPS } from '../config/basemaps'

interface Props {
  value: string
  onChange: (id: string) => void
}

export function BasemapSwitcher({ value, onChange }: Props) {
  return (
    <fieldset className="basemap-switcher">
      <legend className="basemap-switcher__legend">Kartlag</legend>
      {BASEMAPS.map((basemap) => (
        <label
          key={basemap.id}
          className="basemap-switcher__option"
          title={basemap.description}
          data-selected={basemap.id === value}
        >
          <input
            type="radio"
            name="basemap"
            value={basemap.id}
            checked={basemap.id === value}
            onChange={() => onChange(basemap.id)}
          />
          <span>{basemap.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
