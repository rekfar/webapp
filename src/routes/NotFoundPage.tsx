import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { usePageTitle } from '../ui/usePageTitle'
import { PATHS } from './paths'

export function NotFoundPage() {
  const { t } = useTranslation()

  usePageTitle(t('app.documentTitle.notFound'))

  return (
    <div className="page">
      <section className="card">
        <h1 className="card__title">{t('notFound.title')}</h1>
        <p className="card__lead">{t('notFound.body')}</p>
        <Link className="button button--primary" to={PATHS.map}>
          {t('common.toMap')}
        </Link>
      </section>
    </div>
  )
}
