import { NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'

export const runtime = 'nodejs'

const MAX_BYTES = 25 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const entry = formData.get('file')

    if (!(entry instanceof Blob)) {
      return NextResponse.json({ error: 'Missing file field "file".' }, { status: 400 })
    }

    if (entry.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `PDF must be under ${Math.round(MAX_BYTES / (1024 * 1024))} MB.` },
        { status: 413 }
      )
    }

    const file = entry as File
    const name = file.name || ''
    const mime = file.type || ''
    const isPdf =
      mime === 'application/pdf' || mime === 'application/x-pdf' || name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })

    try {
      const result = await parser.getText()
      const text = (result.text || '').trim()
      return NextResponse.json({ text })
    } finally {
      await parser.destroy()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract PDF text.'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
