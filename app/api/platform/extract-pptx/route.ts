import JSZip from 'jszip'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_BYTES = 40 * 1024 * 1024

function isPptxFile(file: File): boolean {
  const name = (file.name || '').toLowerCase()
  const mime = (file.type || '').toLowerCase()
  return (
    name.endsWith('.pptx') ||
    mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )
}

function decodeXmlText(raw: string): string {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n)
      return Number.isFinite(code) && code >= 0 && code < 0x110000 ? String.fromCharCode(code) : ''
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = Number.parseInt(h, 16)
      return Number.isFinite(code) && code >= 0 && code < 0x110000 ? String.fromCharCode(code) : ''
    })
    .replace(/\s+/g, ' ')
    .trim()
}

/** Pull visible text from DrawingML / slide XML (best-effort for deck text + figures). */
function extractTextFromSlideXml(xml: string): string {
  const chunks: string[] = []
  const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const inner = decodeXmlText(m[1] || '')
    if (inner) chunks.push(inner)
  }
  return chunks.join(' ')
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
        { error: `Presentation must be under ${Math.round(MAX_BYTES / (1024 * 1024))} MB.` },
        { status: 413 }
      )
    }

    const file = entry as File
    if (!isPptxFile(file)) {
      return NextResponse.json({ error: 'Only PowerPoint .pptx files are supported (not legacy .ppt).' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const zip = await JSZip.loadAsync(buffer)
    const slidePaths = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n.replace(/\\/g, '/')))
      .sort((a, b) => {
        const na = Number.parseInt(a.match(/slide(\d+)/i)?.[1] || '0', 10)
        const nb = Number.parseInt(b.match(/slide(\d+)/i)?.[1] || '0', 10)
        return na - nb
      })

    const parts: string[] = []
    for (const path of slidePaths) {
      const f = zip.file(path)
      if (!f) continue
      const xml = await f.async('string')
      const text = extractTextFromSlideXml(xml)
      if (text) parts.push(text)
    }

    const text = parts.join('\n\n').trim()
    if (!text) {
      return NextResponse.json(
        { error: 'No extractable text found in this PPTX (images-only slides?).' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract PPTX.'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
