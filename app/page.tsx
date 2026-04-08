import SiteHeader from '@/components/SiteHeader'

export default function Home() {
  return (
    <main>
      <section className="hero" aria-label="Hero">
        <SiteHeader />
        <div className="hero-bg" role="presentation" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-inner">
          <h1 className="hero-title">Clarity is Simplicity</h1>
          <p className="hero-subtitle">
            Context aware codebase evaluator
          </p>
          <a
            href="https://rontzen-victory.vercel.app/"
            className="hero-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            Try beta
          </a>
        </div>
      </section>
    </main>
  )
}
