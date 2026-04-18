export type TeamMember = {
  name: string
  role: string
  bio: string
  linkedinUrl: string
  experience: string[]
}

/** Replace with your real team — URLs and copy are placeholders for layout. */
export const HOME_TEAM: TeamMember[] = [
  {
    name: 'Jordan Lee',
    role: 'CEO & Co-founder',
    bio: 'Product-led operator focused on early GTM, fundraising narrative, and shipping v1→v2 with tight feedback loops.',
    linkedinUrl: 'https://www.linkedin.com/in/jordan-lee',
    experience: [
      'Ex-product lead at a Series B SaaS (0→1 new line, +$4M ARR in 18 mo)',
      'Angel-backed founder (acquihire); built eng + design hiring playbook',
      'Advisor to 3 B2B startups on pricing & positioning',
    ],
  },
  {
    name: 'Sam Rivera',
    role: 'CTO & Co-founder',
    bio: 'Hands-on systems builder: reliability, security review, and pragmatic AI features without blowing up scope.',
    linkedinUrl: 'https://www.linkedin.com/in/sam-rivera',
    experience: [
      'Staff engineer at high-scale API platform (latency, incident response)',
      'Open-source maintainer; conference speaker on distributed systems',
      'Led platform migration cutting infra cost ~35% YoY',
    ],
  },
  {
    name: 'Taylor Kim',
    role: 'Head of Design',
    bio: 'Design systems + narrative design for complex B2B workflows; partners tightly with eng on accessible UI.',
    linkedinUrl: 'https://www.linkedin.com/in/taylor-kim',
    experience: [
      'Redesigned onboarding lifting activation 22 pts at prior startup',
      'Design lead for enterprise compliance UX (SOC2 buyer journey)',
      'Mentor at local founder community & design guild',
    ],
  },
]
