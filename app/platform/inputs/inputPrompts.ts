export type InputPreviewStyle =
  | 'text'
  | 'password'
  | 'search'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'tel'
  | 'url'

export type InputPromptItem = {
  slug: string
  name: string
  useCase: string
  prompt: string
  previewStyle: InputPreviewStyle
}

export const inputPrompts: InputPromptItem[] = [
  {
    slug: 'text-input',
    name: 'Text Input',
    useCase: 'Single-line text',
    previewStyle: 'text',
    prompt:
      'Build a controlled text input in TypeScript React: height 40px, padding 0 12px, radius 8px, border 1px solid rgba(255,255,255,0.18), background rgba(0,0,0,0.35), text #f5f5f5, placeholder #737373, font 14px. States: focus ring 2px rgba(132,198,255,0.55), error border red, disabled opacity 0.5. Include label + optional hint.',
  },
  {
    slug: 'password-input',
    name: 'Password Input',
    useCase: 'Auth forms',
    previewStyle: 'password',
    prompt:
      'Create a password field with show/hide toggle: same shell as text input, monospace optional, toggle button as icon inside trailing slot, aria-pressed on toggle, do not put plaintext in DOM when hidden. Strength meter optional below.',
  },
  {
    slug: 'search-input',
    name: 'Search Input',
    useCase: 'Filters and command palettes',
    previewStyle: 'search',
    prompt:
      'Implement a search input with leading search icon, clear (×) when value non-empty, radius 8px, subtle inner shadow, type="search", role searchbox, Escape clears. Same border/focus system as text input.',
  },
  {
    slug: 'email-input',
    name: 'Email Input',
    useCase: 'Sign up and login',
    previewStyle: 'email',
    prompt:
      'Add an email input: type="email", autocomplete="email", validation message slot below, pattern or library validation on blur, invalid state styling. Match dark theme field specs from text input.',
  },
  {
    slug: 'number-input',
    name: 'Number Input',
    useCase: 'Quantities and IDs',
    previewStyle: 'number',
    prompt:
      'Build a number input with optional stepper buttons (+/−) on the right inside the field shell, min/max props, type="number" or text with inputMode decimal for locale, spinbutton a11y if custom.',
  },
  {
    slug: 'textarea-input',
    name: 'Textarea',
    useCase: 'Long text and notes',
    previewStyle: 'textarea',
    prompt:
      'Create a resizable textarea (resize-y), min-height 96px, same border and focus as text input, character count optional bottom-right, maxLength enforcement.',
  },
  {
    slug: 'select-input',
    name: 'Select / Dropdown',
    useCase: 'Single choice lists',
    previewStyle: 'select',
    prompt:
      'Implement a native select or headless listbox: closed state shows selected label and chevron, radius 8px, dark panel styles, keyboard navigation for listbox, aria-expanded and aria-activedescendant.',
  },
  {
    slug: 'checkbox-input',
    name: 'Checkbox',
    useCase: 'Terms and multi-select',
    previewStyle: 'checkbox',
    prompt:
      'Build an accessible checkbox: 18px box, radius 4px, checked state with checkmark or fill, focus-visible ring, label click target includes text, indeterminate state for "select all" trees.',
  },
  {
    slug: 'switch-input',
    name: 'Toggle Switch',
    useCase: 'Binary settings',
    previewStyle: 'switch',
    prompt:
      'Create a switch (role="switch"): track 44×24px, thumb 20px circle, on state tinted accent, off state muted, aria-checked, keyboard Space toggles, prefers-reduced-motion instant transition.',
  },
  {
    slug: 'date-input',
    name: 'Date Input',
    useCase: 'Scheduling',
    previewStyle: 'date',
    prompt:
      'Add a date field: type="date" or text + date picker button, locale-aware display, min/max constraints, calendar popover styling for dark theme, clear button optional.',
  },
  {
    slug: 'tel-input',
    name: 'Phone Input',
    useCase: 'Contact forms',
    previewStyle: 'tel',
    prompt:
      'Implement tel input with type="tel", inputMode="tel", optional country code prefix slot, formatting on blur (lib or light mask), validation message region.',
  },
  {
    slug: 'url-input',
    name: 'URL Input',
    useCase: 'Links and webhooks',
    previewStyle: 'url',
    prompt:
      'Build URL input: type="url", placeholder https://, normalize on blur (prepend scheme if missing), invalid URL styling, same field shell as text input.',
  },
]
