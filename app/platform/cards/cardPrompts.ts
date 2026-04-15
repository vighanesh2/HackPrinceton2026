export type CardPreviewStyle =
  | 'feature'
  | 'pricing'
  | 'stat'
  | 'profile'
  | 'media'
  | 'listRow'
  | 'emptyState'
  | 'bordered'
  | 'elevated'
  | 'split'

export type CardPromptItem = {
  slug: string
  name: string
  useCase: string
  prompt: string
  previewStyle: CardPreviewStyle
}

export const cardPrompts: CardPromptItem[] = [
  {
    slug: 'feature-card',
    name: 'Feature Card',
    useCase: 'Product marketing',
    previewStyle: 'feature',
    prompt:
      'Build a feature card: white or dark surface, 12–16px radius, padding 20px, top icon in 40px circle, title 18px semibold, body 14px muted, optional link row. Hover: subtle border or shadow lift. Responsive stack on mobile.',
  },
  {
    slug: 'pricing-card',
    name: 'Pricing Card',
    useCase: 'Plans and tiers',
    previewStyle: 'pricing',
    prompt:
      'Create a pricing card with plan name, price line, bullet list, highlighted “Popular” ribbon, and primary CTA. Match grid with 3 columns desktop, 1 column mobile. Include annual toggle hook if needed.',
  },
  {
    slug: 'stat-metric-card',
    name: 'Stat Metric Card',
    useCase: 'Dashboards',
    previewStyle: 'stat',
    prompt:
      'Implement a KPI card: label small caps, large metric (32–40px), delta chip (+12% green / red), sparkline placeholder optional. Consistent height in a dashboard row.',
  },
  {
    slug: 'profile-card',
    name: 'Profile Card',
    useCase: 'Teams and accounts',
    previewStyle: 'profile',
    prompt:
      'Design a profile summary card: avatar left, name + role stacked, secondary actions as icon buttons, soft divider. Truncate long names with ellipsis.',
  },
  {
    slug: 'media-card',
    name: 'Media Card',
    useCase: 'Blog and galleries',
    previewStyle: 'media',
    prompt:
      'Build a media card: 16:9 image area, gradient scrim bottom, title + meta overlay or below image, rounded corners overflow hidden. Lazy image + aspect-ratio CSS.',
  },
  {
    slug: 'list-row-card',
    name: 'List Row Card',
    useCase: 'Settings and feeds',
    previewStyle: 'listRow',
    prompt:
      'Create a dense list row card: leading icon or thumbnail, title + subtitle, trailing chevron or action menu. Full-width tap target, separator between rows.',
  },
  {
    slug: 'empty-state-card',
    name: 'Empty State Card',
    useCase: 'Zero results',
    previewStyle: 'emptyState',
    prompt:
      'Implement an empty state panel: illustration placeholder, headline, supporting copy, primary + secondary actions centered. Max-width ~420px, generous vertical padding.',
  },
  {
    slug: 'bordered-card',
    name: 'Bordered Card',
    useCase: 'Neutral containers',
    previewStyle: 'bordered',
    prompt:
      'Define a bordered card shell: 1px border rgba(255,255,255,0.12) on dark UI, radius 8px, padding 16px, no heavy shadow. Use for forms-in-card or legal text blocks.',
  },
  {
    slug: 'elevated-card',
    name: 'Elevated Card',
    useCase: 'Modals and emphasis',
    previewStyle: 'elevated',
    prompt:
      'Build an elevated card: background slightly above page, box-shadow 0 4px 24px rgba(0,0,0,0.35), radius 12px, optional border 1px subtle. Hover slightly stronger shadow.',
  },
  {
    slug: 'split-content-card',
    name: 'Split Content Card',
    useCase: 'Two-column summaries',
    previewStyle: 'split',
    prompt:
      'Create a card with two columns inside: left text block, right visual or stats, stack on small screens. Use CSS grid gap 16px, min-width 0 for overflow safety.',
  },
]
