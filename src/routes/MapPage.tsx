import { useTranslation } from 'react-i18next'

import { MapView } from '../map/MapView'
import { usePageTitle } from '../ui/usePageTitle'

export function MapPage() {
  const { t } = useTranslation()

  usePageTitle(t('app.documentTitle.map'))

  return (
    <>
      {/* The map is the page, and a canvas has no heading of its own. The
          header's lockup is a link on every route, so it cannot be this one. */}
      <h1 className="visually-hidden">{t('nav.map')}</h1>
      <MapView />
    </>
  )
}
