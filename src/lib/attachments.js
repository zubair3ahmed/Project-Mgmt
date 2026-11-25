export const MAX_BYTES = 10 * 1024 * 1024
export const MAX_FILES = 10
export const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.dwg,.dxf,.rvt,.txt,.zip'

export const extOf = name => (name.includes('.') ? name.split('.').pop() : '').toLowerCase()

export const formatSize = b => (b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`)

export const isImage = a => (a.type || '').startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extOf(a.name))

export function makeAttachments(fileList, user, existingCount = 0) {
  const accepted = []
  const rejected = []
  for (const file of Array.from(fileList)) {
    if (existingCount + accepted.length >= MAX_FILES) { rejected.push(`${file.name}: limit of ${MAX_FILES} files reached`); continue }
    if (file.size > MAX_BYTES) { rejected.push(`${file.name}: larger than 10 MB`); continue }
    const generic = /^image\.(png|jpe?g|gif|webp)$/i.test(file.name)
    const name = generic ? `screenshot-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.${extOf(file.name)}` : file.name
    accepted.push({
      id: `A${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name, size: file.size, type: file.type, url: URL.createObjectURL(file),
      addedBy: user?.name || 'Unknown', addedById: user?.staffId || 'ADMIN', addedAt: new Date().toISOString(),
    })
  }
  return { accepted, rejected }
}

export function folderFor(a) {
  const ext = extOf(a.name)
  const n = a.name.toLowerCase()
  if (isImage(a)) return 'Site Photos'
  if (['dwg', 'dxf', 'rvt'].includes(ext)) return 'Drawings'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Estimates'
  if (/contract|agreement|work.?order|\bwo\b/.test(n)) return 'Contracts'
  if (/report/.test(n)) return 'Reports'
  return 'Specifications'
}
