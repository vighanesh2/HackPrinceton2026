'use client'

import {
  appendDataLineageEvent,
  clearDataLineageEvents,
  formatLineageDisplayTime,
  LINEAGE_KIND_LABEL,
  type LineageEvent,
} from '@/lib/platform/dataLineage'

type Props = {
  events: LineageEvent[]
  onEventsCleared: () => void
}

export function DataLineagePanel({ events, onEventsCleared }: Props) {
  return (
    <article className="notion-doc notion-lineage-tab" aria-label="Data lineage">
      <header className="notion-lineage-head">
        <div>
          <h1 className="notion-lineage-title">Data lineage</h1>
          <p className="notion-lineage-sub">
            Timestamped log of workspace activity in this browser: navigation, saves, imports, and AI-assisted
            updates. Stored locally only.
          </p>
        </div>
        <button
          type="button"
          className="notion-lineage-clear"
          disabled={events.length === 0}
          onClick={() => {
            clearDataLineageEvents()
            appendDataLineageEvent({
              kind: 'lineage_cleared',
              summary: 'Lineage log was cleared',
            })
            onEventsCleared()
          }}
        >
          Clear log
        </button>
      </header>

      {events.length === 0 ? (
        <p className="notion-lineage-empty">No events yet. Switch tabs, edit a document, or run Smart fill to build history.</p>
      ) : (
        <ol className="notion-lineage-list" aria-label="Lineage events, newest first">
          {events.map((ev) => (
            <li key={ev.id} className="notion-lineage-row">
              <div className="notion-lineage-row-meta">
                <span className="notion-lineage-badge">{LINEAGE_KIND_LABEL[ev.kind]}</span>
                <time className="notion-lineage-time" dateTime={ev.ts}>
                  {formatLineageDisplayTime(ev.ts)}
                </time>
              </div>
              <p className="notion-lineage-summary">{ev.summary}</p>
              {ev.detail ? <p className="notion-lineage-detail">{ev.detail}</p> : null}
              {ev.changes?.length ? (
                <ul className="notion-lineage-changes" aria-label="What changed">
                  {ev.changes.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </article>
  )
}
