import SiteHeader from '@/components/SiteHeader'

export default function Home() {
  return (
    <main>
      <section className="hero" aria-label="Hero">
        <SiteHeader />
        <div className="hero-bg" role="presentation">
          <video
            className="hero-bg-video"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden
          >
            <source src="/herobgvideo.mp4" type="video/mp4" />
          </video>
        </div>
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
            <span className="hero-cta-arrow" aria-hidden>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 17L17 7M17 7H10M17 7V14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </a>
        </div>
      </section>
    </main>
  )
}
