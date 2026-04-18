import SiteHeader from '@/components/SiteHeader'
import { HOME_TEAM } from '@/components/homeTeam'
import Link from 'next/link'

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
          <Link href="/platform" className="hero-cta">
            Open app
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
          </Link>
        </div>
      </section>

      <section className="home-team" aria-labelledby="home-team-heading">
        <div className="home-team-inner">
          <h2 id="home-team-heading" className="home-team-title">
            Team
          </h2>
          <p className="home-team-lead">
            Who is building this — short bios, LinkedIn, and the experience that matters for what we ship next.
          </p>
          <ul className="home-team-grid">
            {HOME_TEAM.map((member) => (
              <li key={member.name} className="home-team-card">
                <div className="home-team-card-head">
                  <h3 className="home-team-name">{member.name}</h3>
                  <p className="home-team-role">{member.role}</p>
                </div>
                <p className="home-team-bio">{member.bio}</p>
                <a
                  className="home-team-linkedin"
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn (opens in a new tab)`}
                >
                  LinkedIn profile
                </a>
                <div className="home-team-exp">
                  <h4 className="home-team-exp-title">Relevant experience</h4>
                  <ul>
                    {member.experience.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
