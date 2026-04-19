/**
 * Shared types for Rontzen workspace (PLAN-HackPrinceton.md).
 * Single source of truth for agent, ghost text, and API contracts.
 */

export type CompanyStage = 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth'

export type BusinessModel = 'subscription' | 'usage' | 'transaction' | 'services' | 'hybrid'

export type CompanyContext = {
  companyName: string | null
  oneLiner: string | null
  industry: string | null
  stage: CompanyStage | null
  icp: string | null
  businessModel: BusinessModel | null
  metrics: {
    arrUsd?: number
    mrrUsd?: number
    monthlyBurnUsd?: number
    runwayMonths?: number
    teamSize?: number
    customers?: number
  }
  storyFields: {
    motion?: string
    timelineCommitments?: string[]
    riskPosture?: string
    productScope?: string
  }
  rawNarrative: string
  updatedAt: string
}

/** Row shape for `company_context.profile` JSON (partial updates merge server-side). */
export type CompanyContextProfileJson = Partial<
  Omit<CompanyContext, 'rawNarrative' | 'updatedAt'>
> & {
  rawNarrative?: string
}

export type DocumentClaim = {
  claimKey: string
  claimValue: Record<string, unknown>
  sourceSpan?: { start?: number; end?: number; text?: string } | null
  confidence?: number
}

export type DocType =
  | 'board_memo'
  | 'financial_narrative'
  | 'investor_update'
  | 'sop_raci'
  | 'product_spec'

export type EditSource = 'user' | 'ghost' | 'agent' | 'cross_doc' | 'system'

export type IssueSeverity = 'hard' | 'soft'

export type IssueType = 'metric' | 'narrative'

export type IssueStatus = 'open' | 'dismissed' | 'resolved'
