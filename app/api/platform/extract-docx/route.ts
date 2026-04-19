import mammoth from 'mammoth'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_BYTES = 25 * 1024 * 1024

function isDocxFile(file: File): boolean {
  const name = (file.name || '').toLowerCase()
  const mime = (file.type || '').toLowerCase()
  return (
    name.endsWith('.docx') ||
    name.endsWith('.dotx') ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.template'
  )
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const entry = formData.get('file')

    if (!(entry instanceof Blob)) {
      return NextResponse.json({ error: 'Missing file field "file".' }, { status: 400 })
    }

    if (entry.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `DOCX must be under ${Math.round(MAX_BYTES / (1024 * 1024))} MB.` },
        { status: 413 }
      )
    }

    const file = entry as File
    if (!isDocxFile(file)) {
      return NextResponse.json({ error: 'Only Word .docx (or .dotx) files are supported.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    /** Map common Word paragraph styles to semantic HTML + classes (TipTap-friendly). */
    const styleMap = [
      "p[style-name='Title'] => h1.docx-title:fresh",
      "p[style-name='Subtitle'] => h2.docx-subtitle:fresh",
      "p[style-name='Heading 1'] => h1.docx-h1:fresh",
      "p[style-name='Heading 2'] => h2.docx-h2:fresh",
      "p[style-name='Heading 3'] => h3.docx-h3:fresh",
      // H4–6 as styled paragraphs (TipTap StarterKit headings are usually levels 1–3 only).
      "p[style-name='Heading 4'] => p.docx-h4:fresh",
      "p[style-name='Heading 5'] => p.docx-h5:fresh",
      "p[style-name='Heading 6'] => p.docx-h6:fresh",
      "p[style-name='Quote'] => blockquote.docx-quote:fresh",
      "p[style-name='Intense Quote'] => blockquote.docx-quote.docx-quote-intense:fresh",
    ]

    const result = await mammoth.convertToHtml(
      { buffer },
      { styleMap }
    )
    const html = (result.value || '').trim()
    return NextResponse.json({ html })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract DOCX.'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
