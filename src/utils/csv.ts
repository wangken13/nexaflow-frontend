export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const source = text.replace(/^\uFEFF/, '')
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (quoted && char === '"' && source[index + 1] === '"') { field += '"'; index++; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (!quoted && char === ',') { row.push(field.trim()); field = ''; continue }
    if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && source[index + 1] === '\n') index++
      row.push(field.trim()); field = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
      continue
    }
    field += char
  }
  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  if (quoted) throw new Error('CSV 文件存在未闭合的引号')
  if (rows.length < 2) throw new Error('CSV 文件没有可导入的数据')
  const headers = rows[0].map(value => value.trim().toLowerCase())
  if (new Set(headers).size !== headers.length) throw new Error('CSV 文件包含重复表头')
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])))
}

export function serializeCsv<T extends object>(headers: Array<{ key: keyof T; label: string }>, rows: T[]) {
  const escapeCell = (value: unknown) => {
    let text = value == null ? '' : String(value)
    if (/^[=+\-@]/.test(text)) text = `'${text}`
    return `"${text.replaceAll('"', '""')}"`
  }
  return [
    headers.map(header => escapeCell(header.label)).join(','),
    ...rows.map(row => headers.map(header => escapeCell(row[header.key])).join(','))
  ].join('\r\n')
}

export function downloadCsv<T extends object>(filename: string, headers: Array<{ key: keyof T; label: string }>, rows: T[]) {
  const content = serializeCsv(headers, rows)
  const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
