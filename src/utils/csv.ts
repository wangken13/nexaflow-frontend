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
