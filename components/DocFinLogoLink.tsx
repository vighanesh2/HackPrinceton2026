import Link from 'next/link'

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2l1.2 4.2L17.4 7.4l-4.2 1.2L12 12.8l-1.2-4.2L6.6 7.4l4.2-1.2L12 2z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M18 14l0.6 2.1L20.7 17l-2.1 0.6L18 19.7l-0.6-2.1L15.3 17l2.1-0.6L18 14z"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M6 14l0.6 2.1L8.7 17l-2.1 0.6L6 19.7l-0.6-2.1L3.3 17l2.1-0.6L6 14z"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M12 16l0.4 1.4L13.8 18l-1.4 0.4L12 19.8l-0.4-1.4L10.2 18l1.4-0.4L12 16z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  )
}

type DocFinLogoLinkProps = {
  className?: string
  iconClassName?: string
  brandClassName?: string
}

export function DocFinLogoLink({
  className = 'docfin-logo-link',
  iconClassName = 'docfin-logo-link-icon',
  brandClassName = 'docfin-logo-link-brand',
}: DocFinLogoLinkProps) {
  return (
    <Link href="/" className={className}>
      <SparkleIcon className={iconClassName} />
      <span className={brandClassName}>DocFin</span>
    </Link>
  )
}
