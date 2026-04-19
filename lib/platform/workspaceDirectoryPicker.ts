/**
 * True "pick a folder" uploads using the File System Access API where available.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker
 */

export type WorkspacePickedFile = { file: File; relPath: string }

const MAX_DEPTH = 32

type DirectoryHandle = {
  name: string
  values(): AsyncIterable<FileSystemHandleLike>
}

type FileSystemHandleLike = {
  readonly kind: 'file' | 'directory'
  readonly name: string
}

async function collectFromDirectoryHandle(
  dirHandle: DirectoryHandle,
  prefix: string,
  depth: number
): Promise<WorkspacePickedFile[]> {
  if (depth > MAX_DEPTH) return []
  const out: WorkspacePickedFile[] = []
  for await (const handle of dirHandle.values()) {
    const segment = prefix ? `${prefix}/${handle.name}` : handle.name
    const normalized = segment.replace(/\\/g, '/')
    if (handle.kind === 'directory') {
      out.push(...(await collectFromDirectoryHandle(handle as unknown as DirectoryHandle, normalized, depth + 1)))
    } else {
      // Must call getFile on the handle — extracting the method causes "Illegal invocation".
      const file = await (handle as FileSystemFileHandle).getFile()
      out.push({ file, relPath: normalized })
    }
  }
  return out
}

type WindowWithPicker = Window & {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<DirectoryHandle>
}

export type WorkspaceFolderPickResult =
  | { ok: true; items: WorkspacePickedFile[]; label: string }
  | { ok: false; reason: 'unsupported' | 'aborted' }

/**
 * Opens the OS folder picker and returns every file (recursively) with paths.
 * `unsupported`: use a hidden `webkitdirectory` input as fallback.
 * `aborted`: user cancelled — do not open a second dialog.
 */
export async function pickWorkspaceFolderViaFileSystemAccess(): Promise<WorkspaceFolderPickResult> {
  if (typeof window === 'undefined') return { ok: false, reason: 'unsupported' }
  const picker = (window as WindowWithPicker).showDirectoryPicker
  if (typeof picker !== 'function') return { ok: false, reason: 'unsupported' }

  try {
    const dirHandle = await picker.call(window, { mode: 'read' })
    const label = (dirHandle.name || 'Imported folder').trim() || 'Imported folder'
    const items = await collectFromDirectoryHandle(dirHandle, '', 0)
    return { ok: true, items, label }
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    if (name === 'AbortError') return { ok: false, reason: 'aborted' }
    throw e
  }
}
