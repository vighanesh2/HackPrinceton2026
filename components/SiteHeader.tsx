import Link from 'next/link'

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#features', label: 'Features' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const

function SparkleIcon() {
  return (
    <svg
      className="site-header-logo-icon"
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

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-header-logo">
          <SparkleIcon />
          <span className="site-header-brand">Message</span>
        </Link>

        <nav className="site-header-nav" aria-label="Main">
          <ul className="site-header-links">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <a href={href} className="site-header-link">
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a href="#" className="site-header-cta">
                Get Started
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
