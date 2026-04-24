'use client'

function SparkleGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
    </svg>
  )
}

export function AgentOpenFab({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className="notion-agent-open-fab"
      onClick={onOpen}
      title="Open AI agent"
      aria-label="Open AI agent"
    >
      <SparkleGlyph />
    </button>
  )
}
