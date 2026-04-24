import { DocFinLogoLink } from '@/components/DocFinLogoLink'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <DocFinLogoLink
          className="site-header-logo"
          iconClassName="site-header-logo-icon"
          brandClassName="site-header-brand"
        />
      </div>
    </header>
  )
}
