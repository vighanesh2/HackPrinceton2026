import type { ReactNode } from 'react'
import type { InputPromptItem, InputPreviewStyle } from './inputPrompts'

function FieldShell({ children }: { children: ReactNode }) {
  return <span className="preview-input-shell">{children}</span>
}

const placeholders: Record<InputPreviewStyle, string> = {
  text: 'Enter your name',
  password: '••••••••',
  search: 'Search…',
  email: 'you@example.com',
  number: '0',
  textarea: '',
  select: '',
  checkbox: '',
  switch: '',
  date: 'Apr 15, 2026',
  tel: '+1 (555) 000-0000',
  url: 'https://',
}

export function InputPreview({ item }: { item: InputPromptItem }) {
  const { previewStyle } = item

  if (previewStyle === 'textarea') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-input-textarea">Add a description for your project…</span>
      </div>
    )
  }

  if (previewStyle === 'select') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-input-select">
          <span>Choose an option</span>
          <span className="preview-input-select-chevron" aria-hidden>
            ▾
          </span>
        </span>
      </div>
    )
  }

  if (previewStyle === 'checkbox') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-input-checkbox-row">
          <span className="preview-input-checkbox" />
          <span className="preview-input-checkbox-label">I agree to the terms</span>
        </span>
      </div>
    )
  }

  if (previewStyle === 'switch') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <span className="preview-input-switch-track">
          <span className="preview-input-switch-thumb" />
        </span>
      </div>
    )
  }

  if (previewStyle === 'number') {
    return (
      <div className="platform-catalog-preview" aria-hidden>
        <FieldShell>
          <span className="preview-input-mirror">{placeholders.number}</span>
          <span className="preview-input-stepper" aria-hidden>
            <span className="preview-input-step">+</span>
            <span className="preview-input-step">−</span>
          </span>
        </FieldShell>
      </div>
    )
  }

  const ph = placeholders[previewStyle]

  return (
    <div className="platform-catalog-preview" aria-hidden>
      <FieldShell>
        {previewStyle === 'search' && (
          <span className="preview-input-leading" aria-hidden>
            ⌕
          </span>
        )}
        {previewStyle === 'email' && (
          <span className="preview-input-leading" aria-hidden>
            ✉
          </span>
        )}
        <span className="preview-input-mirror">{ph}</span>
        {previewStyle === 'password' && (
          <span className="preview-input-trailing" aria-hidden>
            👁
          </span>
        )}
      </FieldShell>
    </div>
  )
}
