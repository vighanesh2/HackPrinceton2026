'use client'

/**
 * Renders the uploaded PDF with native browser layout (same pixels as Preview.app / Chrome PDF).
 * Works with a blob: URL from the File; not persisted across reloads.
 */
export function OriginalPdfPreview({ url, docTitle }: { url: string; docTitle: string }) {
  return (
    <details className="notion-original-preview" open>
      <summary className="notion-original-preview-summary">
        Original PDF <span className="notion-original-preview-badge">exact layout</span>
      </summary>
      <p className="notion-original-preview-note">
        Below is your file as the browser renders it. The editor underneath is extracted text for search and edits —
        it will not match page design pixel-for-pixel.
      </p>
      <div className="notion-original-preview-frame">
        <iframe title={`PDF: ${docTitle}`} src={url} className="notion-original-preview-iframe" />
      </div>
    </details>
  )
}
