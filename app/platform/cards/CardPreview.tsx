import type { CardPromptItem } from './cardPrompts'

export function CardPreview({ item }: { item: CardPromptItem }) {
  const s = item.previewStyle

  if (s === 'feature') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-card preview-card-feature">
          <span className="preview-card-feature-icon" aria-hidden />
          <span className="preview-card-feature-title">Ship faster</span>
          <span className="preview-card-feature-desc">Automate reviews and cut release risk.</span>
        </span>
      </div>
    )
  }

  if (s === 'pricing') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-card preview-card-pricing">
          <span className="preview-card-pricing-badge">Popular</span>
          <span className="preview-card-pricing-name">Pro</span>
          <span className="preview-card-pricing-price">$29/mo</span>
          <span className="preview-card-pricing-features" aria-hidden>
            <span className="preview-card-pricing-feature">Unlimited projects</span>
            <span className="preview-card-pricing-feature">Priority support</span>
            <span className="preview-card-pricing-feature">SSO</span>
          </span>
          <span className="preview-card-pricing-cta">Choose plan</span>
        </span>
      </div>
    )
  }

  if (s === 'stat') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-card preview-card-stat">
          <span className="preview-card-stat-label">Active users</span>
          <span className="preview-card-stat-value">12.4k</span>
          <span className="preview-card-stat-delta">+8.2%</span>
        </span>
      </div>
    )
  }

  if (s === 'profile') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-card preview-card-profile">
          <span className="preview-card-profile-avatar" aria-hidden />
          <span className="preview-card-profile-text">
            <span className="preview-card-profile-name">Alex Rivera</span>
            <span className="preview-card-profile-role">Engineering</span>
          </span>
        </span>
      </div>
    )
  }

  if (s === 'media') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-card preview-card-media">
          <span className="preview-card-media-img" aria-hidden />
          <span className="preview-card-media-cap">Launch week recap</span>
        </span>
      </div>
    )
  }

  if (s === 'listRow') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-card preview-card-listrow">
          <span className="preview-card-listrow-lead" aria-hidden />
          <span className="preview-card-listrow-body">
            <span className="preview-card-listrow-title">Notifications</span>
            <span className="preview-card-listrow-sub">Push & email</span>
          </span>
          <span className="preview-card-listrow-chev" aria-hidden>
            ›
          </span>
        </span>
      </div>
    )
  }

  if (s === 'emptyState') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-card preview-card-empty">
          <span className="preview-card-empty-dot" aria-hidden />
          <span className="preview-card-empty-title">No results</span>
          <span className="preview-card-empty-desc">Try another search.</span>
        </span>
      </div>
    )
  }

  if (s === 'bordered') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-card preview-card-bordered">
          <span className="preview-card-bordered-line" />
          <span className="preview-card-bordered-line short" />
        </span>
      </div>
    )
  }

  if (s === 'elevated') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-card preview-card-elevated">
          <span className="preview-card-elevated-title">Summary</span>
          <span className="preview-card-elevated-line" />
        </span>
      </div>
    )
  }

  if (s === 'split') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-card preview-card-split">
          <span className="preview-card-split-left">
            <span className="preview-card-split-h">Overview</span>
            <span className="preview-card-split-p">Key metrics at a glance.</span>
          </span>
          <span className="preview-card-split-right" aria-hidden />
        </span>
      </div>
    )
  }

  return null
}
