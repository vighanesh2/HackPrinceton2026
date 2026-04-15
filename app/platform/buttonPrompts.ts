export type PreviewStyle =
  | 'primary'
  | 'secondary'
  | 'cta'
  | 'ghost'
  | 'danger'
  | 'link'
  | 'outline'
  | 'pill'
  | 'loading'
  | 'fab'
  | 'social'
  | 'chip'
  | 'upload'
  | 'segmented'
  | 'iconOnly'
  | 'tiny'
  | 'block'
  | 'success'
  | 'buttonGroup'

export type ButtonPromptItem = {
  slug: string
  name: string
  useCase: string
  prompt: string
  previewStyle: PreviewStyle
}

export const buttonPrompts: ButtonPromptItem[] = [
  {
    slug: 'button-variant-system',
    name: 'Button Variant System',
    useCase: 'Design system foundations',
    previewStyle: 'primary',
    prompt:
      'Build a single primary button component in TypeScript React that matches this exact preview. Visual spec: inline-flex centered content, border-radius 10px, padding 8px 12px, font-size 13px, font-weight 600, label "Primary action", background #f2f2f2, text color #151515, no visible border. Motion spec: 150ms ease transition for transform and background; on hover use background #f7f7f7 and translateY(-1px); on active return to translateY(0). Accessibility spec: visible focus ring (2px solid, high contrast), keyboard focus-visible support, disabled state with opacity 0.5 and no hover transform.',
  },
  {
    slug: 'animated-cta-button',
    name: 'Animated CTA Button',
    useCase: 'High conversion actions',
    previewStyle: 'cta',
    prompt:
      'Create a high-conversion CTA button that exactly follows this spec: rounded 10px, semibold 13px text, 12px x 8px padding, linear gradient background (90deg, #8ed0ff 0%, #7fb0ff 100%), dark text (#111111), and soft glow shadow (0 4px 15px rgba(84,132,255,0.35)). Include a right arrow icon with 150ms transition. On hover: button translates -1px, shadow increases to 0 7px 22px rgba(84,132,255,0.45), arrow moves +3px on X. On active: translateY(0). On focus-visible: clear 2px accessible outline. Respect prefers-reduced-motion by disabling transforms.',
  },
  {
    slug: 'icon-button-set',
    name: 'Icon Button Set',
    useCase: 'Compact action controls',
    previewStyle: 'secondary',
    prompt:
      'Generate a compact icon action button set that matches this look: dark pill buttons with #272727 background, 1px rgba(255,255,255,0.2) border, #f0f0f0 text, 10px radius, 13px semibold text, 12px x 8px spacing, and 8px icon-text gap. Include actions for Edit, Settings, Share, and Delete. Hover: brighten to #313131 and lift -1px. Active: return to Y=0. Include tooltip labels, keyboard focus-visible outlines, aria-labels for icon meaning, and a danger-styled delete variant with red accent.',
  },
  {
    slug: 'ghost-button',
    name: 'Ghost Button',
    useCase: 'Low-emphasis actions',
    previewStyle: 'ghost',
    prompt:
      'Implement a ghost button matching the preview: transparent background, 1px border rgba(255,255,255,0.28), text #e2e2e2, radius 10px, padding 8px 12px, semibold 13px, label "Continue". Hover: subtle rgba(255,255,255,0.07) fill and translateY(-1px). Focus-visible ring. Disabled: opacity 0.5, no hover motion.',
  },
  {
    slug: 'danger-button',
    name: 'Danger Button',
    useCase: 'Destructive confirmations',
    previewStyle: 'danger',
    prompt:
      'Build a destructive primary-style button: background #3a1515 or similar deep red, border 1px solid rgba(255,100,100,0.45), text #ffe8e8, radius 10px, padding 8px 12px, label "Delete". Hover: slightly brighter red and translateY(-1px). Focus-visible: high-contrast ring. Include loading and disabled states.',
  },
  {
    slug: 'text-link-button',
    name: 'Text Link Button',
    useCase: 'Inline navigation',
    previewStyle: 'link',
    prompt:
      'Create a text-only button that looks like an inline link: no box background, underline on hover, color #9ec8ff default and #cfe4ff on hover, font-weight 600, 13px, label "Learn more". Keep keyboard focus-visible outline distinct from body text. Use button element with type="button" for accessibility.',
  },
  {
    slug: 'outline-button',
    name: 'Outline Button',
    useCase: 'Secondary emphasis on dark UI',
    previewStyle: 'outline',
    prompt:
      'Design an outline button: transparent fill, 1px solid rgba(255,255,255,0.35), text #f0f0f0, radius 10px, padding 8px 12px, semibold 13px, label "Outline". Hover: border rgba(255,255,255,0.55) and faint inner glow. Active: translateY(0). Full focus and disabled styles.',
  },
  {
    slug: 'pill-button',
    name: 'Pill Button',
    useCase: 'Marketing and onboarding',
    previewStyle: 'pill',
    prompt:
      'Implement a pill-shaped primary button: fully rounded (9999px), same light fill #f2f2f2 and dark text #151515 as primary, padding 10px 18px, semibold 13px, label "Get started". Hover: slightly lighter fill, subtle lift. Must not stretch full width unless fullWidth prop is true.',
  },
  {
    slug: 'loading-button',
    name: 'Loading Button',
    useCase: 'Async forms and saves',
    previewStyle: 'loading',
    prompt:
      'Create a button with loading state matching the preview: primary styles, label "Saving…", inline circular spinner to the left of text (8px border, top segment accent color), pointer-events none while loading, aria-busy="true", and optional width lock to prevent layout shift.',
  },
  {
    slug: 'fab-button',
    name: 'Floating Action Button',
    useCase: 'Primary screen action',
    previewStyle: 'fab',
    prompt:
      'Build a circular FAB: 52px diameter, background linear-gradient(135deg, #8ed0ff, #6b9fff), color #111, centered plus icon, shadow 0 12px 28px rgba(40,90,255,0.35). Hover: scale 1.04 and shadow lift. Focus-visible ring. Position fixed bottom-right optional via props. aria-label required.',
  },
  {
    slug: 'social-google-button',
    name: 'Social OAuth Button',
    useCase: 'Sign in with provider',
    previewStyle: 'social',
    prompt:
      'Create a full-width OAuth row button: dark bg #1f1f1f, border 1px rgba(255,255,255,0.12), radius 10px, padding 10px 14px, inline-flex row with 24px circular "G" logo placeholder and label "Continue with Google". Hover: border rgba(255,255,255,0.22). Type button, describe provider in aria.',
  },
  {
    slug: 'chip-button',
    name: 'Removable Chip',
    useCase: 'Filters and tags',
    previewStyle: 'chip',
    prompt:
      'Implement a removable chip: pill radius 999px, bg rgba(255,255,255,0.08), border 1px rgba(255,255,255,0.14), text 12px medium, label plus trailing × remove control. Remove button must be keyboard reachable with aria-label "Remove filter".',
  },
  {
    slug: 'upload-file-button',
    name: 'Upload File Button',
    useCase: 'File pickers',
    previewStyle: 'upload',
    prompt:
      'Design an upload trigger styled as a dashed border button: border 1px dashed rgba(255,255,255,0.35), radius 10px, padding 14px 16px, centered text "Upload file" and subtle cloud icon. Hover: dashed border brighter and bg rgba(255,255,255,0.04). Use hidden file input + label for a11y.',
  },
  {
    slug: 'segmented-control',
    name: 'Segmented Control',
    useCase: 'Mode or view switching',
    previewStyle: 'segmented',
    prompt:
      'Build a 3-segment control: single outer container radius 10px, bg rgba(255,255,255,0.06), border 1px rgba(255,255,255,0.12), segments "Day" | "Week" | "Month" with active segment filled #2a2a2a and inactive text muted. Keyboard: arrow keys move selection, roving tabindex.',
  },
  {
    slug: 'icon-only-button',
    name: 'Icon-only Button',
    useCase: 'Toolbars and tables',
    previewStyle: 'iconOnly',
    prompt:
      'Create a square icon-only button: 32px × 32px, radius 8px, bg #272727, border 1px rgba(255,255,255,0.16), centered ellipsis or menu icon, aria-label "More options". Hover: bg #333. Focus-visible ring.',
  },
  {
    slug: 'small-size-button',
    name: 'Small Size Button',
    useCase: 'Dense UIs',
    previewStyle: 'tiny',
    prompt:
      'Add a small size variant: padding 4px 10px, font 12px semibold, radius 8px, same primary colors as default primary. Expose size="sm" on your Button component.',
  },
  {
    slug: 'block-width-button',
    name: 'Block Width Button',
    useCase: 'Mobile forms',
    previewStyle: 'block',
    prompt:
      'Implement a block primary button: width 100%, max-width optional, same primary styling as default, padding 8px 12px, label "Continue". Hover lift without horizontal overflow.',
  },
  {
    slug: 'success-button',
    name: 'Success Button',
    useCase: 'Positive confirmations',
    previewStyle: 'success',
    prompt:
      'Build a success-styled button: bg #14532d or similar deep green, border 1px rgba(120,220,160,0.45), text #e8fff0, radius 10px, label "Confirm". Hover: lighter green. Pair with success toast patterns.',
  },
  {
    slug: 'attached-button-group',
    name: 'Attached Button Group',
    useCase: 'Dialogs and editors',
    previewStyle: 'buttonGroup',
    prompt:
      'Create a connected button group: left segment "Cancel" outline style, right segment "Save" primary, shared height, no gap between, only outer corners rounded 10px, inner corners square, 1px divider between. Keyboard: Tab through each segment.',
  },
]
