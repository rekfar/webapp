import { useTranslation } from 'react-i18next'

import { BASEMAPS } from '../config/basemaps'

interface Props {
  value: string
  onChange: (id: string) => void
}

export function BasemapSwitcher({ value, onChange }: Props) {
  const { t } = useTranslation()

  return (
    <fieldset className="basemap-switcher">
      <legend className="basemap-switcher__legend">{t('map.basemapLegend')}</legend>
      {BASEMAPS.map((basemap) => (
        <label
          key={basemap.id}
          className="basemap-switcher__option"
          title={t(`map.basemaps.${basemap.id}.description`)}
          data-selected={basemap.id === value}
        >
          <input
            type="radio"
            name="basemap"
            value={basemap.id}
            checked={basemap.id === value}
            onChange={() => onChange(basemap.id)}
          />
          <span>{t(`map.basemaps.${basemap.id}.label`)}</span>
        </label>
      ))}
    </fieldset>
  )
}
