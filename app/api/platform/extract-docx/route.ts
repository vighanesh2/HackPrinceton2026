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
    const result = await mammoth.convertToHtml({ buffer })
    const html = (result.value || '').trim()
    return NextResponse.json({ html })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract DOCX.'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
