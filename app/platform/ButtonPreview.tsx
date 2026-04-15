import type { ButtonPromptItem, PreviewStyle } from './buttonPrompts'

function variantClass(style: PreviewStyle): string {
  switch (style) {
    case 'cta':
      return 'preview-button preview-button-cta'
    case 'secondary':
      return 'preview-button preview-button-secondary'
    case 'ghost':
      return 'preview-button preview-button-ghost'
    case 'danger':
      return 'preview-button preview-button-danger'
    case 'link':
      return 'preview-button preview-button-link'
    case 'outline':
      return 'preview-button preview-button-outline'
    case 'pill':
      return 'preview-button preview-button-primary preview-button-pill'
    case 'loading':
      return 'preview-button preview-button-primary preview-button-loading'
    case 'tiny':
      return 'preview-button preview-button-primary preview-button-tiny'
    case 'block':
      return 'preview-button preview-button-primary preview-button-block'
    case 'success':
      return 'preview-button preview-button-success'
    default:
      return 'preview-button preview-button-primary'
  }
}

function primaryLabel(style: PreviewStyle): string {
  switch (style) {
    case 'cta':
      return 'Start free trial'
    case 'ghost':
      return 'Continue'
    case 'danger':
      return 'Delete'
    case 'link':
      return 'Learn more'
    case 'outline':
      return 'Outline'
    case 'pill':
      return 'Get started'
    case 'loading':
      return 'Saving…'
    default:
      return 'Primary action'
  }
}

export function ButtonPreview({ item }: { item: ButtonPromptItem }) {
  const cls = variantClass(item.previewStyle)

  if (item.previewStyle === 'secondary') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <div className="preview-button-row">
          <span className="preview-button preview-button-secondary">
            <span aria-hidden>✦</span> Edit
          </span>
          <span className="preview-button preview-button-secondary">
            <span aria-hidden>⚙</span> Settings
          </span>
          <span className="preview-button preview-button-secondary">
            <span aria-hidden>⇪</span> Share
          </span>
        </div>
      </div>
    )
  }

  if (item.previewStyle === 'cta') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className={cls}>
          {primaryLabel('cta')}
          <span className="preview-cta-icon" aria-hidden>
            →
          </span>
        </span>
      </div>
    )
  }

  if (item.previewStyle === 'loading') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className={cls}>
          <span className="preview-spinner" aria-hidden />
          {primaryLabel('loading')}
        </span>
      </div>
    )
  }

  if (item.previewStyle === 'fab') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-button-fab">
          <span aria-hidden>+</span>
        </span>
      </div>
    )
  }

  if (item.previewStyle === 'social') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-button-social">
          <span className="preview-button-social-icon" aria-hidden>
            G
          </span>
          Continue with Google
        </span>
      </div>
    )
  }

  if (item.previewStyle === 'chip') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-chip">
          Design
          <span className="preview-chip-remove" aria-hidden>
            ×
          </span>
        </span>
      </div>
    )
  }

  if (item.previewStyle === 'upload') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-upload">
          <span aria-hidden className="preview-upload-icon">
            ☁
          </span>
          Upload file
        </span>
      </div>
    )
  }

  if (item.previewStyle === 'segmented') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <div className="preview-segmented" role="presentation">
          <span className="preview-segmented-item">Day</span>
          <span className="preview-segmented-item is-active">Week</span>
          <span className="preview-segmented-item">Month</span>
        </div>
      </div>
    )
  }

  if (item.previewStyle === 'iconOnly') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-button-icon-only">⋯</span>
      </div>
    )
  }

  if (item.previewStyle === 'tiny') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className={cls}>Small</span>
      </div>
    )
  }

  if (item.previewStyle === 'block') {
    return (
      <div className="platform-catalog-preview platform-catalog-preview-block" aria-hidden>
        <span className={cls}>Continue</span>
      </div>
    )
  }

  if (item.previewStyle === 'success') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className={cls}>Confirm</span>
      </div>
    )
  }

  if (item.previewStyle === 'buttonGroup') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <div className="preview-button-group">
          <span className="preview-button-group-item preview-button-group-cancel">Cancel</span>
          <span className="preview-button-group-item preview-button-group-save">Save</span>
        </div>
      </div>
    )
  }

  if (
    item.previewStyle === 'ghost' ||
    item.previewStyle === 'danger' ||
    item.previewStyle === 'link' ||
    item.previewStyle === 'outline' ||
    item.previewStyle === 'pill'
  ) {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className={cls}>{primaryLabel(item.previewStyle)}</span>
      </div>
    )
  }

  return (
    <div className="platform-catalog-preview" aria-hidden>
      <span className={cls}>{primaryLabel('primary')}</span>
      <div className="preview-button-row">
        <span className="preview-button preview-button-secondary">Secondary</span>
        <span className="preview-button preview-button-ghost">Ghost</span>
      </div>
    </div>
  )
}
